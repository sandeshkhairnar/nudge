import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { recipient_id, sender_id, roomName, preview, project_id } = await req.json();

    if (!recipient_id && !project_id) {
      return NextResponse.json({ error: 'Missing recipient or project' }, { status: 400 });
    }
    if (!sender_id || !roomName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check if an active call log for this room already exists
    const { data: existingCall } = await supabaseAdmin
      .from('call_logs')
      .select('*')
      .eq('room_name', roomName)
      .neq('status', 'ended')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 1b. Check if a "started" message was recently sent to avoid duplicates (race conditions)
    const { data: recentMessage } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .eq('user_id', sender_id)
      .filter('content', 'ilike', `%${roomName}%`) // Case insensitive search for room name in content
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isDuplicate = recentMessage && (new Date().getTime() - new Date(recentMessage.created_at).getTime() < 30000); // 30s gap

    let callLogId = existingCall?.id || null;
    const isNew = !existingCall || existingCall.status === 'ringing';

    if (!existingCall) {
      // Create new log if none found
      const callType = project_id ? 'project' : 'direct';
      const { data: newCall } = await supabaseAdmin.from('call_logs').insert({
        room_name: roomName,
        type: callType,
        project_id: project_id ?? null,
        initiator_id: sender_id,
        recipient_id: callType === 'direct' ? recipient_id : null,
        status: 'ringing',
        started_at: new Date().toISOString(),
      }).select().single();
      callLogId = newCall?.id ?? null;
    } else if (existingCall.status === 'ringing') {
      // Update existing ringing/scheduled call to ongoing
      await supabaseAdmin.from('call_logs').update({
        status: 'ongoing',
        started_at: existingCall.started_at || new Date().toISOString()
      }).eq('id', existingCall.id);
    }

    // 2. Notify recipient for direct calls (only if new or ringing)
    if (recipient_id && isNew) {
      await supabaseAdmin.from('notifications').insert({
        recipient_id,
        sender_id,
        type: 'call',
        content: roomName,
        preview: preview ?? 'Incoming call...',
      });
    }

    // 3. Post system message to project channel if this is a project call (only once)
    const activeProjectId = project_id || (existingCall?.project_id);
    if (activeProjectId && isNew && !isDuplicate) {
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles').select('full_name').eq('id', sender_id).single();
      const { data: channels } = await supabaseAdmin
        .from('channels').select('id').eq('project_id', activeProjectId).limit(1);

      if (channels?.[0]) {
        const senderName = (senderProfile as { full_name: string | null } | null)?.full_name ?? 'Someone';
        const meetingUrl = `/space/video-call?room=${encodeURIComponent(roomName)}`;
        await supabaseAdmin.from('messages').insert({
          channel_id: channels[0].id,
          user_id: sender_id,
          content: JSON.stringify({
            text: ` **${senderName} started a meeting.** [Join now](${meetingUrl})`,
            type: 'system_call',
            room: roomName,
          }),
          is_ai: false,
        });
      }
    }

    return NextResponse.json({ success: true, callLogId: callLogId });
  } catch (error: any) {
    console.error('Call route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
