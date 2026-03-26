import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const identity = searchParams.get('identity');

    if (!room || !identity) {
      return NextResponse.json({ error: 'Missing room or identity' }, { status: 400 });
    }

    const engineUrl = `${process.env.NEXT_PUBLIC_AI_ENGINE_URL || process.env.AI_ENGINE_URL}/video/token?room=${room}&identity=${identity}`;
    const engineSecret = process.env.ENGINE_SECRET;

    if (!engineSecret) {
      return NextResponse.json({ error: 'AI Engine secret not configured' }, { status: 500 });
    }

    const response = await fetch(engineUrl, {
      method: 'GET',
      headers: {
        'X-Engine-Secret': engineSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Engine error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Video Token Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
