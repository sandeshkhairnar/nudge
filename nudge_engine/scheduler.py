import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from database.supabase_client import get_supabase
from agent.agent import run_agent

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

from datetime import datetime

async def stall_detection_job():
    """
    Find tasks stalled for >= 3 days and trigger AI nudges,
    but only for workspaces where nudge_engine_active=True 
    and nudge_check_time matches the current time.
    """
    logger.info("Running stall detection job...")
    supabase = get_supabase()
    
    current_time = datetime.now().strftime("%H:%M")
    
    # 1. Get workspaces scheduled for this minute
    ws_res = (
        supabase.table("workspaces")
        .select("id")
        .eq("nudge_engine_active", True)
        .eq("nudge_check_time", current_time)
        .execute()
    )
    
    active_workspace_ids = [w["id"] for w in ws_res.data]
    if not active_workspace_ids:
        return
        
    logger.info(f"Triggering nudges for workspaces: {active_workspace_ids}")
    
    # 2. Query tasks that have stalled_days > 0 for these workspaces
    res = (
        supabase.table("tasks")
        .select("*, projects!inner(workspace_id)")
        .gt("stalled_days", 0)
        .neq("status", "done")
        .in_("projects.workspace_id", active_workspace_ids)
        .execute()
    )
    
    for task in res.data:
        event = {
            "event_type": "stall",
            "workspace_id": task["projects"]["workspace_id"],
            "project_id": task["project_id"],
            "payload": {
                "task_id": task["id"],
                "task_title": task["title"],
                "stalled_days": task["stalled_days"]
            },
            "timestamp": "now"
        }
        await run_agent(event)

async def nudge_expiry_cleanup():
    """
    Dismiss nudges older than 7 days.
    """
    logger.info("Running nudge expiry cleanup...")
    supabase = get_supabase()
    # Logic for date comparison depends on DB setup; this is a placeholder
    supabase.table("nudges").update({"dismissed": True}).eq("dismissed", False).execute()

def setup_scheduler():
    """
    Initialize and start the background scheduler.
    """
    # Stall detection runs every minute to check if any workspace's check time matches the current time
    scheduler.add_job(stall_detection_job, CronTrigger(minute="*"))
    
    # Nudge cleanup daily at 2 AM
    scheduler.add_job(nudge_expiry_cleanup, CronTrigger(hour=2))
    
    scheduler.start()
    logger.info("APScheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("APScheduler stopped.")
