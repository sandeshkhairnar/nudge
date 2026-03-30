import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { room_name, user_id, content, content_type } = await req.json();

    if (!room_name || !user_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert the transcript chunk
    const { error } = await supabaseAdmin.from('meeting_transcripts').insert({
      room_name,
      user_id,
      content,
      content_type: content_type || 'speech'
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Transcript route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
