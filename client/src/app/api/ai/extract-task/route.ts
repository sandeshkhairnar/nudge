import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    const engineUrl = `${process.env.AI_ENGINE_URL}/task/extract`;
    const engineSecret = process.env.ENGINE_SECRET;

    if (!engineSecret) {
      return new Response('AI Engine secret not configured', { status: 500 });
    }

    const proxyFormData = new FormData();
    proxyFormData.append('file', file);

    const response = await fetch(engineUrl, {
      method: 'POST',
      headers: {
        'X-Engine-Secret': engineSecret,
      },
      body: proxyFormData,
    });

    if (!response.ok) {
      const txt = await response.text();
      return new Response('Failed to connect to AI engine: ' + txt, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('AI Proxy Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
