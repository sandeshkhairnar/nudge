// lib/messages.ts
// ─── Message actions + Realtime hook ──────────────────────────
//
// Architecture decision:
// We use SUPABASE REALTIME (postgres_changes + Broadcast) instead
// of Socket.io. Supabase Realtime is built on Phoenix Channels /
// WebSockets, is globally distributed, and requires zero extra
// infrastructure. Socket.io would require a separate server.
//
// Pattern:
//  1. Fetch initial messages on mount (server action / client fetch).
//  2. Subscribe to postgres_changes INSERT for the channel.
//  3. On new message, append optimistically to local state.

"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// ─── Fetch messages (paginated, newest last) ──────────────────
export async function getMessages(
  channelId: string,
  limit = 50,
  before?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("messages")
    .select(`
      id,
      content,
      is_ai,
      created_at,
      edited_at,
      user_id,
      profiles!messages_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  // Return in ascending order for display
  return { messages: (data ?? []).reverse() };
}

// ─── Send a message ───────────────────────────────────────────
export async function sendMessage(data: {
  channelId: string;
  content: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      channel_id: data.channelId,
      user_id: user.id,
      content: data.content.trim(),
    })
    .select(`
      id,
      content,
      is_ai,
      created_at,
      user_id,
      profiles!messages_user_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) return { error: error.message };
  return { message: msg };
}

// ─── Edit a message ───────────────────────────────────────────
export async function editMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("messages")
    .update({ content: content.trim(), edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Delete a message ─────────────────────────────────────────
export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}