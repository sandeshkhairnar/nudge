import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { recipient_id, sender_id, roomName, preview } = await req.json();

    if (!recipient_id || !sender_id || !roomName || !preview) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from('notifications').insert({
      recipient_id,
      sender_id,
      type: 'call',
      content: roomName,
      preview,
    });

    if (error) {
      console.error("Failed to insert call notification:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
