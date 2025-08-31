import { getGroqModels } from '@/lib/groq';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const models = await getGroqModels();
    return new NextResponse(JSON.stringify(models), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}