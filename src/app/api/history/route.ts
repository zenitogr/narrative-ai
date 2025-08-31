import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stepId = searchParams.get('stepId');
  
  // For now, we'll assume a single user. We'll add user auth later.
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Dummy user ID

  try {
    const baseQuery = supabase
      .from('suggestion_steps')
      .select(`
        id,
        created_at,
        is_fork,
        parent_step_id,
        user_choices (
          suggestions (
            suggestion_text
          )
        ),
        suggestions (
          suggestion_text
        )
      `)
      .eq('user_id', userId);

    if (stepId) {
      const { data, error } = await baseQuery.eq('id', stepId).single();
      if (error) throw error;
      return new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await baseQuery.order('created_at', { ascending: true });

    if (error) throw error;

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch history' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}