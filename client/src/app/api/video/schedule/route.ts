import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { sender_id, project_id, recipient_id, room_name, scheduled_at, title } = await req.json();

    if (!sender_id || !scheduled_at || !room_name) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const callType = project_id ? 'project' : 'direct';

    // 1. Create the scheduled call log
    const { data: callLog, error } = await supabaseAdmin.from('call_logs').insert({
      room_name,
      type: callType,
      project_id: project_id ?? null,
      initiator_id: sender_id,
      recipient_id: callType === 'direct' ? recipient_id : null,
      status: 'ringing',
      scheduled_at,
    }).select().single();

    if (error) throw error;

    // 2. Post a scheduling notice to the project channel
    if (project_id) {
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles').select('full_name').eq('id', sender_id).single();
      const { data: channels } = await supabaseAdmin
        .from('channels').select('id').eq('project_id', project_id).limit(1);
      if (channels?.[0]) {
        const senderName = (senderProfile as { full_name: string | null } | null)?.full_name ?? 'Someone';
        const scheduledDate = new Date(scheduled_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const meetingUrl = `/space/video-call?room=${encodeURIComponent(room_name)}`;
        await supabaseAdmin.from('messages').insert({
          channel_id: channels[0].id,
          user_id: sender_id,
          content: JSON.stringify({
            text: `**${senderName} scheduled a meeting** for **${scheduledDate}**.\n${title ? `> ${title}\n` : ''}[Join when it starts](${meetingUrl})`,
            type: 'system_scheduled',
            room: room_name,
            scheduled_at,
          }),
          is_ai: false,
        });
      }
    }

    return NextResponse.json({ success: true, callLog });
  } catch (error: any) {
    console.error('Schedule route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
