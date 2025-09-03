import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { suggestions, choices, parentStepId, isFork } = await req.json();

  // For now, we'll assume a single user. We'll add user auth later.
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Dummy user ID

  try {
    // Ensure the user exists before creating a step
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({ id: userId })
      .select()
      .single();

    if (userError) throw userError;

    // Create a new suggestion step
    const { data: stepData, error: stepError } = await supabase
      .from('suggestion_steps')
      .insert({ user_id: userData.id, parent_step_id: parentStepId, is_fork: isFork })
      .select()
      .single();

    if (stepError) throw stepError;

    // Save the suggestions for this step
    const suggestionRecords = suggestions.map((s: string) => ({
      step_id: stepData.id,
      suggestion_text: s,
    }));
    const { data: suggestionData, error: suggestionError } = await supabase
      .from('suggestions')
      .insert(suggestionRecords)
      .select();

    if (suggestionError) throw suggestionError;

    // Save the user's choices
    const choiceRecords = choices.map((c: string) => {
      const suggestion = suggestionData?.find(s => s.suggestion_text === c);
      return {
        step_id: stepData.id,
        suggestion_id: suggestion.id,
      };
    });
    const { error: choiceError } = await supabase
      .from('user_choices')
      .insert(choiceRecords);

    if (choiceError) throw choiceError;

    return new NextResponse(JSON.stringify({ stepId: stepData.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to save choices' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}