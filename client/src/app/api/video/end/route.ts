import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { call_log_id, room_name, status } = await req.json();

    if (!call_log_id && !room_name) {
      return NextResponse.json({ error: 'Missing call_log_id or room_name' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch the current state BEFORE updating to see if we should send a message
    let checkRoom = room_name;
    let currentStatus = 'unknown';
    let pId = null;

    if (call_log_id) {
      const { data: log } = await supabaseAdmin.from('call_logs').select('room_name, status, project_id').eq('id', call_log_id).single();
      if (log) {
        checkRoom = log.room_name;
        currentStatus = log.status;
        pId = log.project_id;
      }
    } else {
      const { data: log } = await supabaseAdmin.from('call_logs').select('status, project_id').eq('room_name', room_name).in('status', ['ringing', 'ongoing']).order('created_at', { ascending: false }).limit(1).single();
      if (log) {
        currentStatus = log.status;
        pId = log.project_id;
      }
    }

    // 3. Update the log
    const finalStatus = status === 'ongoing' ? 'ongoing' : (status === 'missed' ? 'missed' : 'ended');
    const updatePayload: any = { status: finalStatus };
    if (finalStatus !== 'ongoing') updatePayload.ended_at = new Date().toISOString();

    if (call_log_id) {
      await supabaseAdmin.from('call_logs').update(updatePayload).eq('id', call_log_id);
    } else {
      await supabaseAdmin.from('call_logs').update(updatePayload).eq('room_name', room_name).in('status', ['ringing', 'ongoing']);
    }

    // 4. Post system message ONLY if transitioning to ended/missed for the FIRST time
    if ((status === 'ended' || status === 'missed') && currentStatus !== 'ended' && currentStatus !== 'missed') {
      if (checkRoom && checkRoom.startsWith('project-')) {
        const projectId = pId || checkRoom.replace('project-', '');
        const { data: channels } = await supabaseAdmin
          .from('channels').select('id').eq('project_id', projectId).limit(1);
          
        if (channels?.[0]) {
          const { data: callInfo } = await supabaseAdmin.from('call_logs').select('initiator_id').eq('room_name', checkRoom).order('created_at', { ascending: false }).limit(1).single();
          const userId = callInfo?.initiator_id || 'system';

          const { data: senderProfile } = await supabaseAdmin
            .from('profiles').select('full_name').eq('id', userId).single();
          const senderName = (senderProfile as { full_name: string | null } | null)?.full_name ?? 'Someone';

          const msgText = status === 'missed' ? `**${senderName}'s meeting ended (missed).**` : `**${senderName} ended the meeting.**`;

          await supabaseAdmin.from('messages').insert({
            channel_id: channels[0].id,
            user_id: userId,
            content: JSON.stringify({
              text: msgText,
              type: 'system_call_ended',
              room: checkRoom,
            }),
            is_ai: false,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('End call route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
