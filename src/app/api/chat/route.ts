import groq from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, model } = await req.json();

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: model || 'llama3-8b-8192',
      stream: true,
    });

    return new NextResponse(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch completion' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}