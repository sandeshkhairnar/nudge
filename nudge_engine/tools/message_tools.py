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
