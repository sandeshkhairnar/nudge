import json
import uuid
from langchain_core.tools import tool
from database.supabase_client import get_supabase

# ── Dedicated Nudge AI Bot User ID ────────────────────────────────────────────
# This is the permanent system-bot profile created in Supabase.
# Every AI/engine-generated message MUST use this ID, no exceptions.
NUDGE_BOT_ID = "6e6cb238-3601-4873-8e92-9a0c54614991"

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

@tool
def create_ai_message(
    channel_id: str,
    content: str,
) -> str:
    """
    Post a conversational AI reply to a specific chat channel.
    Always sent as the Nudge AI Bot — never requires a user_id.
    Use this for direct replies within a channel conversation.
    """
    if not is_valid_uuid(channel_id):
        return f"Error: '{channel_id}' is not a valid Channel ID UUID."

    supabase = get_supabase()
    data = {
        "channel_id": channel_id,
        "content": content,
        "is_ai": True,
        "user_id": NUDGE_BOT_ID
    }
    res = supabase.table("messages").insert(data).execute()
    if res.data:
        return f"AI message posted: {res.data[0].get('id')}"
    return "Error: Failed to post AI message."

@tool
async def create_system_message(
    project_id: str,
    text: str,
    system_type: str = "system_nudge"
) -> str:
    """
    Post a system/alert message to a project's first available chat channel.
    Used for automated alerts: task stalls, GitHub events, health updates, MOMs.
    The message will be formatted as a JSON card for the frontend renderer.
    Always sent as the Nudge AI Bot — never requires a user_id.
    """
    if not is_valid_uuid(project_id):
        return f"Error: '{project_id}' is not a valid Project ID UUID."

    supabase = get_supabase()

    # 1. Find the first channel for the project
    ch_res = (
        supabase.table("channels")
        .select("id")
        .eq("project_id", project_id)
        .order("created_at")
        .limit(1)
        .execute()
    )
    if not ch_res.data:
        return f"Error: No channels found for project {project_id}"

    channel_id = ch_res.data[0]["id"]

    # 2. Format content depending on system_type
    if system_type == "chat":
        # Send raw text to render as a normal AI message bubble
        content_json = text
    else:
        # Format as JSON card for the frontend renderer
        content_obj = {
            "type": "mom_card" if system_type == "system_mom" else system_type,
            "text": text
        }
        content_json = json.dumps(content_obj)

    # 3. Insert using the dedicated Nudge AI Bot ID — always
    data = {
        "channel_id": channel_id,
        "content": content_json,
        "is_ai": True,
        "user_id": NUDGE_BOT_ID
    }

    res = supabase.table("messages").insert(data).execute()
    if res.data:
        return f"System message posted to channel {channel_id}: {res.data[0].get('id')}"
    return "Error: Failed to post system message."

@tool
def analyze_message_context(message_id: str) -> str:
    """
    Fetch additional context around a specific message (e.g. recent conversation)
    to help the AI make better decisions about task creation or replies.
    """
    try:
        uuid.UUID(str(message_id))
    except ValueError:
        return f"Error: '{message_id}' is not a valid UUID. Please ensure you are passing a real Message ID."

    supabase = get_supabase()
    try:
        msg_res = (
            supabase.table("messages")
            .select("channel_id")
            .eq("id", message_id)
            .maybe_single()
            .execute()
        )

        if not msg_res.data:
            return f"Message with ID {message_id} not found."

        channel_id = msg_res.data["channel_id"]

        # Fetch last 5 messages in the same channel for context
        history = (
            supabase.table("messages")
            .select("*")
            .eq("channel_id", channel_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        return str(history.data)
    except Exception as e:
        return f"Error fetching message context: {str(e)}"
