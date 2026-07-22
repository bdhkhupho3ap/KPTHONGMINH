import { NextResponse } from 'next/server';
import { performKeepAlive } from '@/lib/database/keepalive';

export async function GET() {
  const result = await performKeepAlive();
  return NextResponse.json({
    success: result.success,
    database: result.database,
    timestamp: result.timestamp
  });
}
