// lib/channels.ts
// ─── Channel CRUD (Server Actions) ────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// ─── Create Channel ───────────────────────────────────────────
export async function createChannel(data: {
  projectId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Sanitise channel name: lowercase, no spaces
  const sanitisedName = data.name.toLowerCase().replace(/\s+/g, "-");

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      project_id: data.projectId,
      name: sanitisedName,
      description: data.description ?? null,
      is_private: data.isPrivate ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto-join creator
  await supabase.from("channel_members").insert({
    channel_id: channel.id,
    user_id: user.id,
  });

  revalidatePath(`/space/${data.projectId}`);
  return { channel };
}

// ─── Get Channels for Project ─────────────────────────────────
export async function getProjectChannels(projectId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("channels")
    .select(`
      *,
      channel_members(count),
      messages(count)
    `)
    .eq("project_id", projectId)
    .or(`is_private.eq.false,created_by.eq.${user?.id}`)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { channels: data };
}

// ─── Get Unread Counts ────────────────────────────────────────
export async function getUnreadCounts(channelIds: string[]) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return {};

  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel_id, last_read_at")
    .eq("user_id", user.id)
    .in("channel_id", channelIds);

  if (!memberships) return {};

  const counts: Record<string, number> = {};

  await Promise.all(
    memberships.map(async (m) => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", m.channel_id)
        .gt("created_at", m.last_read_at ?? "1970-01-01");
      counts[m.channel_id] = count ?? 0;
    })
  );

  return counts;
}

// ─── Mark Channel as Read ─────────────────────────────────────
export async function markChannelRead(channelId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
    .from("channel_members")
    .upsert({
      channel_id: channelId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    });
}

// ─── Delete Channel ───────────────────────────────────────────
export async function deleteChannel(channelId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", channelId)
    .neq("name", "general"); // protect the auto-created general channel

  if (error) return { error: error.message };

  revalidatePath(`/space/${projectId}`);
  return { success: true };
}