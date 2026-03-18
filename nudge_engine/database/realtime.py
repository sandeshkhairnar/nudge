import asyncio
import logging
from typing import Any, Dict

from database.supabase_client import get_supabase
from config import get_settings

# Note: In a real implementation, we would import run_agent from agent.agent
# But we'll use a placeholder for now to avoid circular imports during setup.

logger = logging.getLogger(__name__)

def handle_new_message(payload: Dict[str, Any]):
    """
    Callback for new messages INSERT event.
    """
    from agent.agent import run_agent
    from database.supabase_client import get_supabase
    
    record = payload.get("record", {})
    if record.get("is_ai"):
        return

    logger.info(f"New message detected: {record.get('id')}")
    
    # Fetch workspace/project context via channel
    supabase = get_supabase()
    channel_res = supabase.table("channels").select("project_id, projects(workspace_id)").eq("id", record.get("channel_id")).single().execute()
    
    channel_data = channel_res.data or {}
    project_id = channel_data.get("project_id")
    workspace_id = channel_data.get("projects", {}).get("workspace_id")

    event = {
        "event_type": "message",
        "workspace_id": workspace_id,
        "project_id": project_id,
        "payload": {
            "message_id": record.get("id"),
            "channel_id": record.get("channel_id"),
            "user_id": record.get("user_id"),
            "content": record.get("content"),
            "is_ai": False
        },
        "timestamp": record.get("created_at")
    }
    
    # Schedule the agent run using asyncio.create_task in the currently running loop
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(run_agent(event))
    except RuntimeError:
        asyncio.run(run_agent(event))

def handle_task_update(payload: Dict[str, Any]):
    """
    Callback for tasks UPDATE event.
    """
    record = payload.get("record", {})
    old_record = payload.get("old_record", {})
    
    if record.get("status") == "done" and old_record.get("status") != "done":
        logger.info(f"Task marked as done: {record.get('id')}")
        # Logic to check milestones/completion could go here

async def setup_realtime_subscriptions():
    """
    Register Supabase Realtime channel and listeners.
    """
    from database.supabase_client import get_async_supabase
    supabase = await get_async_supabase()
    
    # Define the channel
    channel = supabase.channel("nudge-changes")
    
    # Listen for new messages
    await channel.on_postgres_changes(
        event="INSERT",
        schema="public",
        table="messages",
        callback=handle_new_message
    ).on_postgres_changes(
        event="UPDATE",
        schema="public",
        table="tasks",
        callback=handle_task_update
    ).subscribe()
    
    logger.info("Supabase Realtime subscriptions established.")
