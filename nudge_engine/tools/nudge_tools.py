from langchain_core.tools import tool
from database.supabase_client import get_supabase
from services.audit_service import write_audit_log

@tool
async def generate_nudge(
    workspace_id: str,
    project_id: str,
    task_id: str,
    content: str
) -> str:
    """
    Insert a new AI nudge into the database. This nudge will appear on the user's dashboard.
    """
    supabase = get_supabase()
    data = {
        "workspace_id": workspace_id,
        "project_id": project_id,
        "task_id": task_id,
        "content": content,
        "dismissed": False
    }
    res = supabase.table("nudges").insert(data).execute()
    
    # Audit log
    await write_audit_log(workspace_id, "nudge_generated", {"task_id": task_id})
    
    return f"Nudge generated: {res.data[0].get('id')}"

@tool
def flag_stalled(task_id: str, days: int = 1) -> str:
    """
    Mark a task as stalled by incrementing its stalled_days count.
    """
    supabase = get_supabase()
    
    # Fetch current stalled_days
    current_res = supabase.table("tasks").select("stalled_days").eq("id", task_id).single().execute()
    if not current_res.data:
        return f"Error: Task {task_id} not found."
        
    current_days = current_res.data.get("stalled_days") or 0
    new_days = current_days + days
    
    # Update with new value
    res = supabase.table("tasks").update({"stalled_days": new_days}).eq("id", task_id).execute()
    return f"Task {task_id} stalled days incremented to {new_days}."
