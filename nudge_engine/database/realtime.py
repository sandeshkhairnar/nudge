import asyncio
import logging
from typing import Any, Dict

from database.supabase_client import get_supabase
from config import get_settings

logger = logging.getLogger(__name__)

# Trigger keyword — agent only runs when the message contains this
NUDGE_TRIGGER = "@nudge"


def handle_new_message(payload: Dict[str, Any]):
    """
    Callback for new messages INSERT event.
    Guards against:
      - Empty / None record (Realtime can fire before the row is populated)
      - Missing channel_id (would cause a 400 on the channels query)
      - AI-generated messages (avoid infinite loops)
      - Messages that don't mention @nudge (avoid triggering on every message)

    Supabase Realtime payload shape (supabase-py v2):
      {
        'data': {
          'schema': 'public',
          'table': 'messages',
          'type': 'INSERT',
          'record': { ...the new row... },
          'old_record': {}
        },
        'ids': [...]
      }
    """
    from agent.agent import run_agent
    from database.supabase_client import get_supabase

    # ── 1. Log the raw payload for debugging ──────────────────────────────────
    logger.info(f"Realtime INSERT received | top-level keys: {list(payload.keys())}")

    # ── 2. Unwrap the nested 'data' envelope (supabase-py v2 shape) ───────────
    # Fall back to top-level 'record' for older SDK versions.
    inner = payload.get("data") or {}
    if inner:
        logger.info(f"Realtime INSERT inner keys: {list(inner.keys())}")

    record = inner.get("record") or payload.get("record") or {}

    # ── 3. Guard: empty record ────────────────────────────────────────────────
    if not record or not isinstance(record, dict):
        logger.warning("Realtime: INSERT event has empty/invalid record — skipping.")
        return

    message_id = record.get("id")
    channel_id = record.get("channel_id")
    is_ai      = record.get("is_ai", False)
    content    = record.get("content", "") or ""

    logger.info(f"Realtime: message_id={message_id}  channel_id={channel_id}  is_ai={is_ai}")

    # ── 4. Guard: skip AI messages ────────────────────────────────────────────
    if is_ai:
        logger.debug("Realtime: skipping AI-generated message.")
        return

    # ── 5. Guard: must have a valid channel_id ────────────────────────────────
    if not channel_id:
        logger.warning(f"Realtime: message {message_id} has no channel_id — skipping.")
        return

    # ── 6. Guard: only trigger on @nudge mentions ─────────────────────────────
    if NUDGE_TRIGGER.lower() not in content.lower():
        logger.debug(f"Realtime: message {message_id} has no {NUDGE_TRIGGER} mention — skipping.")
        return

    logger.info(f"Realtime: @nudge mentioned in message {message_id} — triggering agent.")

    # ── 6. Resolve workspace / project via channel ────────────────────────────
    supabase = get_supabase()
    try:
        channel_res = (
            supabase.table("channels")
            .select("project_id, projects(workspace_id)")
            .eq("id", channel_id)
            .single()
            .execute()
        )
        channel_data = channel_res.data or {}
    except Exception as e:
        logger.error(f"Realtime: failed to fetch channel {channel_id}: {e}")
        return

    project_id   = channel_data.get("project_id")
    workspace_id = (channel_data.get("projects") or {}).get("workspace_id")

    if not workspace_id:
        logger.warning(f"Realtime: could not resolve workspace_id for channel {channel_id} — skipping.")
        return

    event = {
        "event_type": "message",
        "workspace_id": workspace_id,
        "project_id": project_id,
        "payload": {
            "message_id": message_id,
            "channel_id": channel_id,
            "user_id": record.get("user_id"),
            "content": content,
            "is_ai": False,
        },
        "timestamp": record.get("created_at"),
    }

    logger.info(f"Realtime: dispatching agent event | workspace={workspace_id}  project={project_id}")

    # ── 7. Schedule agent as a background task ────────────────────────────────
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(run_agent(event))
    except RuntimeError:
        asyncio.run(run_agent(event))


def handle_task_update(payload: Dict[str, Any]):
    """
    Callback for tasks UPDATE event.
    """
    logger.debug(f"Realtime: task UPDATE payload keys: {list(payload.keys())}")

    record     = payload.get("record") or {}
    old_record = payload.get("old_record") or {}

    if not record:
        logger.warning("Realtime: task UPDATE received with empty record — skipping.")
        return

    if record.get("status") == "done" and old_record.get("status") != "done":
        logger.info(f"Realtime: task marked as done: {record.get('id')}")
        # Milestone / completion logic can be added here


async def setup_realtime_subscriptions():
    """
    Register Supabase Realtime channel and listeners.
    """
    from database.supabase_client import get_async_supabase
    supabase = await get_async_supabase()

    channel = supabase.channel("nudge-changes")

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
