import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stepId = searchParams.get('stepId');
  const mode = searchParams.get('mode');
  const cacheBuster = searchParams.get('cacheBuster');
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Dummy user ID

  if (mode === 'total') {
    try {
      if (!cacheBuster) {
        const { data, error } = await supabase
          .from('total_analysis')
          .select('analysis_text')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          return new NextResponse(JSON.stringify({ analysis: data.analysis_text }), { status: 200 });
        }
      }
      // If cacheBuster is present or no data found, proceed to generate a new one, but return null for GET
      return new NextResponse(JSON.stringify({ analysis: null }), { status: 200 });
    } catch (error) {
      console.error('Error in total analysis GET route:', error);
      return new NextResponse(JSON.stringify({ error: 'Failed to get total analysis' }), { status: 500 });
    }
  }

  if (!stepId || !mode) {
    return new NextResponse(JSON.stringify({ error: 'Missing stepId or mode' }), { status: 400 });
  }

  const tableName = mode === 'full' ? 'full_item_analysis' : 'item_analysis';

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('analysis_text')
      .eq('user_id', userId)
      .eq('step_id', stepId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return new NextResponse(JSON.stringify({ analysis: data?.analysis_text || null }), { status: 200 });
  } catch (error) {
    console.error('Error in analysis GET route:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to get analysis' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, stepId, history, model: modelFromClient, mode } = await req.json();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    // Ensure user exists
    const { error: userError } = await supabase.from('users').upsert({ id: userId });
    if (userError) throw userError;

    if (stepId !== 'total') {
      const tableName = mode === 'full' ? 'full_item_analysis' : 'item_analysis';
      // First, validate that the stepId exists for this user
      const { data: stepExists, error: stepCheckError } = await supabase
        .from('suggestion_steps')
        .select('id')
        .eq('id', stepId)
        .eq('user_id', userId)
        .single();

      if (stepCheckError || !stepExists) {
        throw new Error('Invalid stepId or permission denied.');
      }

      // Check if analysis already exists
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from(tableName)
        .select('analysis_text')
        .eq('user_id', userId)
        .eq('step_id', stepId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingAnalysis) {
        return new NextResponse(JSON.stringify({ analysis: existingAnalysis.analysis_text }), { status: 200 });
      }
    }

    // If not, generate new analysis
    const model = modelFromClient || 'llama3-8b-8192';
    const prompt = `You are a personality analysis expert. Your task is to analyze a user's journey based on a series of choices they have made. The user's journey is provided as a JSON object. Focus *only* on the 'suggestion_text' within the 'user_choices' array for your analysis. Do not reference the number of choices made or any other metadata. Provide a thoughtful, narrative-style analysis of the user's personality and decision-making process based *exclusively* on the text of the choices they made.

    User's Journey Data:
    ${JSON.stringify(history, null, 2)}`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
    });

    const analysisText = chatCompletion.choices[0]?.message?.content || '';

    // Save the new analysis
    if (stepId === 'total') {
      const { error: upsertError } = await supabase
        .from('total_analysis')
        .insert({ user_id: userId, analysis_text: analysisText });
      if (upsertError) throw upsertError;
    } else {
      const tableName = mode === 'full' ? 'full_item_analysis' : 'item_analysis';
      const { error: upsertError } = await supabase
        .from(tableName)
        .upsert({ user_id: userId, step_id: stepId, analysis_text: analysisText });

      if (upsertError) {
        throw upsertError;
      }
    }

    return new NextResponse(JSON.stringify({ analysis: analysisText }), { status: 200 });

  } catch (error) {
    console.error('Error in analysis route:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to get analysis' }), { status: 500 });
  }
}