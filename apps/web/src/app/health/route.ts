import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'TechAssess Web Portal',
    time: new Date().toISOString(),
  });
}
