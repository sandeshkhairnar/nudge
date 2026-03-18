import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, content } = body;

    const engineUrl = `${process.env.AI_ENGINE_URL}/agent/chat/stream`;
    const engineSecret = process.env.ENGINE_SECRET;

    if (!engineSecret) {
      return new Response('AI Engine secret not configured', { status: 500 });
    }

    const response = await fetch(engineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Engine-Secret': engineSecret,
      },
      body: JSON.stringify({ workspace_id, content }),
    });

    if (!response.ok) {
      return new Response('Failed to connect to AI engine', { status: response.status });
    }

    // Proxy the stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('AI Proxy Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
