// app/api/test-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Session Test ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const session = await getServerSession(authOptions);
    
    console.log('Session result:', JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: session,
      userId: session.user?.id,
      userIdType: typeof session.user?.id
    });

  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json(
      { error: 'Session test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}