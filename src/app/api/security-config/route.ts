import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      turnstileRequired: process.env.TURNSTILE_REQUIRED === 'true',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
