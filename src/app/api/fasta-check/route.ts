import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, clientIp, enforceRateLimit, readJsonBody, REQUEST_LIMITS, securityErrorResponse, validateProteinFasta } from '@/lib/request-security';

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    enforceRateLimit('fasta-check', clientIp(req), 30, 60 * 1000);
    const declaredLength = Number.parseInt(req.headers.get('content-length') || '0', 10);
    if (declaredLength > REQUEST_LIMITS.bodyBytes) return new NextResponse('fastaerror-input-too-large', { status: 413 });

    let sequence = '';
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const value = formData.get('sequence');
      sequence = value instanceof File ? await value.text() : typeof value === 'string' ? value : '';
    } else {
      const body = await readJsonBody<{ sequence?: unknown }>(req);
      sequence = typeof body.sequence === 'string' ? body.sequence : '';
    }

    const validation = validateProteinFasta(sequence);
    return validation.valid
      ? new NextResponse('proceed', { status: 200 })
      : new NextResponse(`fastaerror-${validation.error}`, { status: 400 });
  } catch (error: unknown) {
    const securityResponse = securityErrorResponse(error);
    return securityResponse || new NextResponse('fastaerror-validation-failed', { status: 500 });
  }
}
