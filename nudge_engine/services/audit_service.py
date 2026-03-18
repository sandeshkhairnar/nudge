import logging
from typing import Any, Dict
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

async def write_audit_log(
    workspace_id: str,
    event_type: str,
    details: Dict[str, Any],
    actor_id: str = "nudge-engine"
):
    """
    Write an append-only log entry (currently only login to logger due to missing table).
    """
    logger.info(f"AUDIT LOG: {workspace_id} | {event_type} | {details}")
    # try:
    #     supabase = get_supabase()
    #     supabase.table("audit_logs").insert({
    #         "workspace_id": workspace_id,
    #         "event_type": event_type,
    #         "details": details,
    #         "actor_id": actor_id
    #     }).execute()
    # except Exception as e:
    #     logger.error(f"Failed to write audit log: {e}")
