import { NextResponse } from 'next/server';

// This route has been intentionally disabled as the project no longer tracks study_time.
// Keep a stub here to avoid 404 noise during deploys; it always returns 404.
export async function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
