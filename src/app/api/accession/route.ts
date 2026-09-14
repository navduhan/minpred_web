import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, clientIp, enforceRateLimit, parseAccessions, readJsonBody, REQUEST_LIMITS, RequestSecurityError, securityErrorResponse, validateProteinFasta } from '@/lib/request-security';

async function fetchFasta(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
  if (!response.ok) return '';
  const declaredLength = Number.parseInt(response.headers.get('content-length') || '0', 10);
  if (declaredLength > REQUEST_LIMITS.bodyBytes) throw new RequestSecurityError('The remote FASTA response is too large.', 413);
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > REQUEST_LIMITS.bodyBytes) throw new RequestSecurityError('The remote FASTA response is too large.', 413);
  return text;
}

async function fetchIndividually(accessions: string[]) {
  const results: string[] = [];
  for (let offset = 0; offset < accessions.length; offset += 5) {
    const batch = accessions.slice(offset, offset + 5);
    results.push(...await Promise.all(batch.map((accession) => fetchFasta(`https://rest.uniprot.org/uniprotkb/${encodeURIComponent(accession)}.fasta`))));
  }
  return results.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    enforceRateLimit('accession', clientIp(req), 20, 60 * 1000);
    const body = await readJsonBody<{ accessions?: unknown; db?: unknown }>(req);
    const accessions = parseAccessions(body.accessions);
    const db = body.db;
    if (db !== 'ncbi' && db !== 'uniprot') return NextResponse.json({ error: 'Database must be ncbi or uniprot.' }, { status: 400 });

    let fasta = '';
    if (db === 'ncbi') {
      const ids = encodeURIComponent(accessions.join(','));
      fasta = await fetchFasta(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=${ids}&rettype=fasta&retmode=text`);
    } else {
      const ids = encodeURIComponent(accessions.join(','));
      fasta = await fetchFasta(`https://rest.uniprot.org/uniprotkb/accessions?accessions=${ids}&format=fasta`);
      if (!fasta) fasta = await fetchIndividually(accessions);
    }

    const validation = validateProteinFasta(fasta);
    if (!validation.valid) return NextResponse.json({ error: 'The requested accessions did not return valid protein FASTA within the service limits.' }, { status: 404 });
    return NextResponse.json({ success: true, fasta, count: validation.sequenceCount, accessions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch accessions.' }, { status: 502 });
  }
}
