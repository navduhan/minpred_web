import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, bearerToken, clientIp, enforceRateLimit, readJsonBody, securityErrorResponse } from '@/lib/request-security';
import { readJobSequence, readPredictionJob, verifyJobToken } from '@/lib/prediction-jobs';
import { predictSecondary } from '@/lib/structure';

import { cachedStructure } from '@/lib/structure-cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = await readJsonBody<{ jobId?: unknown; sampleId?: unknown }>(req);
    const jobId = typeof body.jobId === 'string' ? body.jobId : '';
    const sampleId = typeof body.sampleId === 'string' ? body.sampleId : '';
    const job = await readPredictionJob(jobId);
    if (!verifyJobToken(job, bearerToken(req))) return NextResponse.json({ error: 'Prediction job was not found.' }, { status: 404 });
    const sequence = await readJobSequence(jobId, sampleId);
    return NextResponse.json({ sampleId, sequenceLength: sequence.length, ...(await cachedStructure(jobId, sequence, 'secondary', () => { enforceRateLimit('secondary-structure', clientIp(req), 10, 60 * 60 * 1000); return predictSecondary(sequence); })) });
  } catch (error: unknown) {
    const security = securityErrorResponse(error); if (security) return security;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Secondary-structure prediction failed.' }, { status: 400 });
  }
}
