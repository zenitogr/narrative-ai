import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  const { models } = await req.json();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an expert in AI model selection. Given a list of available models, choose the best model for each of the following tasks:
1.  **Suggestion**: This task requires a fast and creative model to generate a few words of text.
2.  **Analysis**: This task requires a powerful and accurate model to perform in-depth analysis of a user's journey.

Respond with a JSON object containing your selections, in the format:
{
  "suggestionModel": "model-id-for-suggestion",
  "analysisModel": "model-id-for-analysis"
}

Available Models:
${JSON.stringify(models, null, 2)}
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192', // Using a capable model to make the selection
      response_format: { type: 'json_object' },
    });

    const selection = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');

    return new NextResponse(JSON.stringify(selection), { status: 200 });
  } catch (error) {
    console.error('Error in smart-select route:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to select models' }), { status: 500 });
  }
}