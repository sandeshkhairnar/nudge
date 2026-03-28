import json
from langchain_core.tools import tool
from database.supabase_client import get_supabase

@tool
def create_ai_message(
    channel_id: str,
    content: str,
    user_id: str
) -> str:
    """
    Post a message back to a chat channel from the AI.
    """
    supabase = get_supabase()
    data = {
        "channel_id": channel_id,
        "content": content,
        "is_ai": True,
        "user_id": user_id
    }
    res = supabase.table("messages").insert(data).execute()
    return f"AI message posted: {res.data[0].get('id')}"

@tool
async def create_system_message(
    project_id: str,
    text: str,
    system_type: str = "system_nudge"
) -> str:
    """
    Post a system message to a project's first available chat channel.
    Useful for automated alerts, task stalls, or project health updates.
    The message will be formatted as a JSON string for the frontend.
    """
    supabase = get_supabase()
    
    # 1. Find the first channel for the project
    ch_res = supabase.table("channels").select("id").eq("project_id", project_id).order("created_at").limit(1).execute()
    if not ch_res.data:
        return f"Error: No channels found for project {project_id}"
    
    channel_id = ch_res.data[0]["id"]

    # 2. Find a valid user in the project to satisfy NOT NULL constraint
    # (In a real system, we'd use a dedicated 'System Bot' user ID)
    user_res = supabase.table("project_members").select("user_id").eq("project_id", project_id).limit(1).execute()
    if not user_res.data:
        # Fallback to any user if project has no members? (Shouldn't happen)
        fallback_res = supabase.table("profiles").select("id").limit(1).execute()
        user_id = fallback_res.data[0]["id"] if fallback_res.data else None
    else:
        user_id = user_res.data[0]["user_id"]

    if not user_id:
        return "Error: Could not find a valid user to back the system message."
    
    # 3. Format as JSON for the frontend system message renderer
    # If it's a MOM, we use the specific 'mom_card' type as requested
    if system_type == "system_mom":
        content_obj = {
            "type": "mom_card",
            "text": text
        }
        content_json = json.dumps(content_obj)
    else:
        content_obj = {
            "type": system_type,
            "text": text
        }
        content_json = json.dumps(content_obj)
    
    # 4. Insert into messages
    data = {
        "channel_id": channel_id,
        "content": content_json,
        "is_ai": (system_type == "system_mom"), # Make it an AI message if it's a MOM
        "user_id": user_id
    }
    
    res = supabase.table("messages").insert(data).execute()
    return f"System message posted to channel {channel_id} (Acting User: {user_id}): {res.data[0].get('id')}"

@tool
def analyze_message_context(message_id: str) -> str:
    """
    Fetch additional context around a specific message (e.g. recent conversation)
    to help the AI make better decisions.
    """
    supabase = get_supabase()
    # Fetch last 5 messages in the same channel
    msg = supabase.table("messages").select("channel_id").eq("id", message_id).single().execute()
    if not msg.data:
        return "Message not found."
    
    history = supabase.table("messages").select("*").eq("channel_id", msg.data["channel_id"]).order("created_at", desc=True).limit(5).execute()
    return str(history.data)
