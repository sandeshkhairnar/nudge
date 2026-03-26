import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from database.supabase_client import get_supabase
from config import get_settings
from agent.agent import run_agent

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

from datetime import datetime, timedelta, timezone

async def stall_detection_job():
    print("DEBUG: stall_detection_job ENTERED")
    try:
        supabase = get_supabase()
        print("DEBUG: supabase client initialized")
        current_time = datetime.now().strftime("%H:%M")
        print(f"\033[94m[Nudge Engine]\033[0m Checking schedules for: \033[92m{current_time}\033[0m")
        
        # 1. Get workspaces scheduled for this minute
        try:
            ws_res = (
                supabase.table("workspaces")
                .select("id, name, nudge_check_time, nudge_check_times")
                .eq("nudge_engine_active", True)
                .execute()
            )
        except Exception as e:
            print(f"\033[91m[Nudge Engine]\033[0m Error fetching workspaces: {e}")
            ws_res = (
                supabase.table("workspaces")
                .select("id, name, nudge_check_time")
                .eq("nudge_engine_active", True)
                .execute()
            )
        
        active_workspaces = []
        for ws in ws_res.data:
            times = ws.get("nudge_check_times") or []
            legacy_time = ws.get("nudge_check_time")
            ws_name = ws.get("name", ws["id"])
            
            # Match current time against array or legacy string
            is_match = (isinstance(times, list) and current_time in times) or current_time == legacy_time
            
            if is_match:
                active_workspaces.append(ws["id"])
                print(f"\033[92m[Nudge Engine]\033[0m Match found for workspace: {ws_name}")
            else:
                # Optional: print(f"  - No match for {ws_name} (Schedules: {times}, {legacy_time})")
                pass

        if not active_workspaces:
            return
            
        print(f"\033[93m[Nudge Engine]\033[0m Triggering nudges for {len(active_workspaces)} workspaces...")
        
        # 2. Query tasks that have stalled_days >= threshold for these workspaces
        settings = get_settings()
        threshold = settings.stall_threshold_days
        
        res = (
            supabase.table("tasks")
            .select("*, projects!inner(workspace_id)")
            .gte("stalled_days", threshold)
            .neq("status", "done")
            .in_("projects.workspace_id", active_workspaces)
            .execute()
        )
        
        task_count = len(res.data)
        
        print(f"\033[94m[Nudge Engine]\033[0m Found {task_count} stalled tasks (Threshold: {threshold} days).")
        
        if task_count == 0:
            # Still log the attempt for transparency
            for ws_id in active_workspaces:
                supabase.table("nudge_logs").insert({
                    "workspace_id": ws_id,
                    "status": "success",
                    "message": f"Found 0 tasks with stall threshold of {threshold} days.",
                    "nudges_count": 0
                }).execute()
            return

        count = 0
        
        for task in res.data:
            task_id = task["id"]
            
            # --- Deduplication: Don't nudge if we already did in the last 24h ---
            # Check for existing nudges for this task created today
            yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            existing = (
                supabase.table("nudges")
                .select("id")
                .eq("task_id", task_id)
                .gt("created_at", yesterday)
                .limit(1)
                .execute()
            )
            
            if existing.data:
                # Optionally log: print(f"  - Skipping task {task_id}: Nudge recently sent.")
                continue

            ws_id = task["projects"]["workspace_id"]
            event = {
                "event_type": "stall",
                "workspace_id": ws_id,
                "project_id": task["project_id"],
                "payload": {
                    "task_id": task_id,
                    "task_title": task["title"],
                    "stalled_days": task["stalled_days"]
                },
                "timestamp": "now"
            }
            await run_agent(event)
            count += 1
            
            # 3. Log the activity
            for ws_id in active_workspaces:
                supabase.table("nudge_logs").insert({
                    "workspace_id": ws_id,
                    "status": "success",
                    "message": f"Processed {count} stalled tasks",
                    "nudges_count": count
                }).execute()
            
    except Exception as e:
        logger.error(f"Error in stall_detection_job: {e}", exc_info=True)

def get_next_run_time(workspaces):
    """
    Calculate the next scheduled check-in time across all active workspaces.
    """
    now = datetime.now()
    current_time_str = now.strftime("%H:%M")
    
    all_times = []
    for ws in workspaces:
        times = ws.get("nudge_check_times") or []
        legacy = ws.get("nudge_check_time")
        if legacy: times.append(legacy)
        all_times.extend(times)
    
    if not all_times:
        return None
        
    # Sort unique times
    unique_times = sorted(list(set(all_times)))
    
    # Find the first time greater than current_time
    for t in unique_times:
        if t > current_time_str:
            return t
            
    # If no time today is greater, the next run is the first one tomorrow
    return unique_times[0]

async def terminal_status_job():
    """
    Periodic job to print the next scheduled run to the terminal.
    """
    supabase = get_supabase()
    try:
        ws_res = (
            supabase.table("workspaces")
            .select("nudge_check_time, nudge_check_times")
            .eq("nudge_engine_active", True)
            .execute()
        )
    except Exception:
        ws_res = (
            supabase.table("workspaces")
            .select("nudge_check_time")
            .eq("nudge_engine_active", True)
            .execute()
        )
    
    next_time = get_next_run_time(ws_res.data)
    if next_time:
        print(f"\033[94m[Nudge Engine]\033[0m Next scheduled check-in: \033[92m{next_time}\033[0m")
    else:
        print("\033[94m[Nudge Engine]\033[0m No active schedules.")

async def update_stalled_days_job():
    """
    Calculate and update stalled_days for all active tasks.
    Formula: stalled_days = (now - created_at).days
    """
    try:
        print("\033[94m[Nudge Engine]\033[0m Starting automated stalled_days update...")
        supabase = get_supabase()
        
        # 1. Fetch all non-done tasks
        res = (
            supabase.table("tasks")
            .select("id, created_at, status, stalled_days")
            .neq("status", "done")
            .execute()
        )
        
        tasks = res.data
        if not tasks:
            print("\033[94m[Nudge Engine]\033[0m No active tasks found to update.")
            return

        now = datetime.now()
        updated_count = 0
        
        for task in tasks:
            created_at_str = task["created_at"]
            try:
                # Parse ISO date safely
                # Example: 2026-03-19T03:49:31.035031+00:00
                created_date = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                # Make local for comparison if needed, or stick to UTC logic
                # For simplicity in 'days' calculation, we just use the date part
                delta = now.date() - created_date.date()
                new_stalled_days = max(0, delta.days)
                
                # Only update if value changed
                if task.get("stalled_days") != new_stalled_days:
                    supabase.table("tasks").update({"stalled_days": new_stalled_days}).eq("id", task["id"]).execute()
                    updated_count += 1
            except Exception as e:
                print(f"\033[91m[Nudge Engine]\033[0m Error processing task {task['id']}: {e}")

        print(f"\033[92m[Nudge Engine]\033[0m Successfully updated stalled_days for {updated_count} tasks.")
            
    except Exception as e:
        print(f"\033[91m[Nudge Engine]\033[0m Error in update_stalled_days_job: {e}")

async def nudge_expiry_cleanup():
    """
    Dismiss nudges older than 7 days.
    """
    logger.info("Running nudge expiry cleanup...")
    supabase = get_supabase()
    supabase.table("nudges").update({"dismissed": True}).eq("dismissed", False).execute()

def setup_scheduler():
    """
    Initialize and start the background scheduler.
    """
    # Stall detection runs every minute
    scheduler.add_job(stall_detection_job, CronTrigger(minute="*"), misfire_grace_time=30)
    
    # Print status to terminal every minute
    scheduler.add_job(terminal_status_job, CronTrigger(minute="*"), misfire_grace_time=30)
    
    # Update stalled days every 30 mins and once on startup
    scheduler.add_job(update_stalled_days_job, CronTrigger(minute="*/30"), misfire_grace_time=60)
    
    # Run startup jobs almost immediately with a large grace time
    start_time = datetime.now()
    scheduler.add_job(update_stalled_days_job, 'date', run_date=start_time, misfire_grace_time=300)
    scheduler.add_job(terminal_status_job, 'date', run_date=start_time, misfire_grace_time=300)
    
    # Nudge cleanup daily at 2 AM
    scheduler.add_job(nudge_expiry_cleanup, CronTrigger(hour=2), misfire_grace_time=3600)
    
    scheduler.start()
    logger.info("APScheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("APScheduler stopped.")
