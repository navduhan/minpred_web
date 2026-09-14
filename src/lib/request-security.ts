import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export class RequestSecurityError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfter?: number) {
    super(message);
    this.name = 'RequestSecurityError';
  }
}

type RateWindow = { count: number; resetAt: number };
const rateWindows = new Map<string, RateWindow>();
const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const REQUEST_LIMITS = {
  bodyBytes: positiveInteger(process.env.MAX_REQUEST_BODY_BYTES, 67_108_864),
  accessionCount: positiveInteger(process.env.MAX_ACCESSION_COUNT, 100),
  accessionLength: positiveInteger(process.env.MAX_ACCESSION_LENGTH, 64),
  sequenceCount: positiveInteger(process.env.PREDICTION_MAX_SEQUENCES, 10_000),
  totalResidues: positiveInteger(process.env.PREDICTION_MAX_RESIDUES, 50_000_000),
  sequenceLength: positiveInteger(process.env.PREDICTION_MAX_SEQUENCE_LENGTH, 5_000),
};

export function clientIp(req: NextRequest) {
  return req.headers.get('x-real-ip')?.trim()
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return;
  const expectedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!expectedHost) throw new RequestSecurityError('Request origin could not be verified.', 403);
  try {
    if (new URL(origin).host !== expectedHost) throw new RequestSecurityError('Cross-origin requests are not allowed.', 403);
  } catch (error) {
    if (error instanceof RequestSecurityError) throw error;
    throw new RequestSecurityError('Invalid request origin.', 403);
  }
}

export function enforceRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${identity}`;
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
  } else if (current.count >= limit) {
    throw new RequestSecurityError('Too many requests. Please try again later.', 429, Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
  } else {
    current.count += 1;
  }

  if (rateWindows.size > 10_000) {
    for (const [entryKey, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(entryKey);
  }
}

export async function readJsonBody<T>(req: NextRequest): Promise<T> {
  const declaredLength = Number.parseInt(req.headers.get('content-length') || '0', 10);
  if (declaredLength > REQUEST_LIMITS.bodyBytes) throw new RequestSecurityError('Request body is too large.', 413);
  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > REQUEST_LIMITS.bodyBytes) throw new RequestSecurityError('Request body is too large.', 413);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestSecurityError('Request body must be valid JSON.', 400);
  }
}

export function validateProteinFasta(fastaText: string, sequenceType: 'prot'|'nucl' = 'prot') {
  if (!fastaText || !fastaText.trim()) return { valid: false, error: 'FASTA sequence content is empty.' };
  if (Buffer.byteLength(fastaText, 'utf8') > REQUEST_LIMITS.bodyBytes) return { valid: false, error: 'FASTA input is too large.' };

  const records: number[] = [];
  let currentLength = -1;
  let totalResidues = 0;
  for (const rawLine of fastaText.trim().split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('>')) {
      if (line.length === 1) return { valid: false, error: 'Each FASTA record must have a non-empty header.' };
      if (currentLength === 0) return { valid: false, error: 'Each FASTA header must be followed by a sequence.' };
      if (currentLength > 0) records.push(currentLength);
      currentLength = 0;
      if (records.length + 1 > REQUEST_LIMITS.sequenceCount) return { valid: false, error: `A maximum of ${REQUEST_LIMITS.sequenceCount} sequences is allowed per job.` };
      continue;
    }
    if (currentLength < 0) return { valid: false, error: 'FASTA input must begin with a ">" header.' };
    const residues = line.replace(/\s+/g, '').toUpperCase();
    if (!(sequenceType === 'nucl' ? /^[ACGTUN]+$/ : /^[ACDEFGHIKLMNPQRSTVWYX]+$/).test(residues)) return { valid: false, error: sequenceType === 'nucl' ? 'Nucleotide FASTA may contain A, C, G, T, U and N only.' : 'FASTA may contain the 20 standard amino acids and X only.' };
    currentLength += residues.length;
    totalResidues += residues.length;
    if (currentLength > REQUEST_LIMITS.sequenceLength) return { valid: false, error: `An individual sequence cannot exceed ${REQUEST_LIMITS.sequenceLength} residues.` };
    if (totalResidues > REQUEST_LIMITS.totalResidues) return { valid: false, error: `A job cannot exceed ${REQUEST_LIMITS.totalResidues} total residues.` };
  }
  if (currentLength <= 0) return { valid: false, error: 'The final FASTA header must be followed by a sequence.' };
  records.push(currentLength);
  return { valid: true, sequenceCount: records.length, totalResidues };
}

export function parseAccessions(value: unknown) {
  if (typeof value !== 'string') throw new RequestSecurityError('Accession IDs must be provided as text.', 400);
  const values = value.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
  if (!values.length) throw new RequestSecurityError('No valid accession IDs were provided.', 400);
  if (values.length > REQUEST_LIMITS.accessionCount) throw new RequestSecurityError(`A maximum of ${REQUEST_LIMITS.accessionCount} accessions can be fetched at once.`, 400);
  if (values.some((item) => item.length > REQUEST_LIMITS.accessionLength || !/^[A-Za-z0-9_.:-]+$/.test(item))) {
    throw new RequestSecurityError('One or more accession IDs contain invalid characters.', 400);
  }
  return values;
}

export async function verifyTurnstile(token: unknown, ip: string) {
  if (process.env.TURNSTILE_REQUIRED !== 'true') return;
  if (typeof token !== 'string' || !token) throw new RequestSecurityError('Please complete the anti-bot verification.', 403);
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new RequestSecurityError('Anti-bot verification is not configured on the server.', 503);
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== 'unknown') body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body, signal: AbortSignal.timeout(8_000), cache: 'no-store',
  });
  const result = await response.json() as { success?: boolean };
  if (!response.ok || !result.success) throw new RequestSecurityError('Anti-bot verification failed. Please try again.', 403);
}

export function ownerHash(ip: string) {
  const secret = process.env.JOB_OWNER_HMAC_SECRET || 'development-only-owner-secret';
  return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

export function bearerToken(req: NextRequest) {
  const privateJobToken = req.headers.get('x-minpred-job-token')?.trim();
  if (privateJobToken) return privateJobToken;
  const header = req.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export function securityErrorResponse(error: unknown) {
  if (!(error instanceof RequestSecurityError)) return null;
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (error.retryAfter) headers['Retry-After'] = String(error.retryAfter);
  return NextResponse.json({ error: error.message }, { status: error.status, headers });
}
