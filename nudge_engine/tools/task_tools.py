from datetime import datetime, timedelta
from typing import Optional, List
from langchain_core.tools import tool
from database.supabase_client import get_supabase
from services.audit_service import write_audit_log

@tool
def get_tasks(workspace_id: str, project_id: Optional[str] = None) -> str:
    """
    Fetch a list of active tasks for a workspace or specific project.
    """
    supabase = get_supabase()
    # Join with projects to filter by workspace_id since tasks table lacks it
    query = supabase.table("tasks").select("*, projects!inner(workspace_id)").eq("projects.workspace_id", workspace_id)
    
    if project_id:
        query = query.eq("project_id", project_id)
    
    res = query.neq("status", "done").execute()
    return str(res.data)

def resolve_user_id(name: str, supabase) -> Optional[str]:
    """
    Try to resolve a human name to a UUID from the profiles table.
    If name is already a UUID, return it.
    """
    if not name:
        return None
        
    # Check if it's already a UUID (basic check)
    if len(name) == 36 and "-" in name:
        return name

    # Search by full_name
    res = supabase.table("profiles").select("id").ilike("full_name", f"%{name}%").limit(1).execute()
    if res.data:
        return res.data[0]["id"]
    
    # Search by email as fallback
    res = supabase.table("profiles").select("id").ilike("email", f"%{name}%").limit(1).execute()
    if res.data:
        return res.data[0]["id"]
        
    return None

@tool
def create_task(
    workspace_id: str,
    project_id: str,
    title: str,
    description: Optional[str] = None,
    assignee_id: Optional[str] = None
) -> str:
    """
    Create a new task in the project board.
    The 'assignee_id' can be a UUID or a human name (e.g. 'Sandesh' or 'Adarsh').
    """
    supabase = get_supabase()
    
    # Resolve name to ID if needed
    final_assignee_id = assignee_id
    if assignee_id and not (len(assignee_id) == 36 and "-" in assignee_id):
        resolved_id = resolve_user_id(assignee_id, supabase)
        if resolved_id:
            final_assignee_id = resolved_id
        else:
            return f"Error: Could not find a user matching the name '{assignee_id}'. Please provide a more specific name or their ID."

    data = {
        "project_id": project_id,
        "title": title,
        "description": description,
        "assignee_id": final_assignee_id,
        "status": "todo"
    }
    res = supabase.table("tasks").insert(data).execute()
    
    # Audit log
    write_audit_log(workspace_id, "task_created", {"task_id": res.data[0].get("id"), "title": title})
    
    return f"Task created successfully: {res.data[0].get('id')}"

@tool
def update_task_status(task_id: str, status: str) -> str:
    """
    Update the status of an existing task (e.g. todo -> in_progress -> done).
    """
    supabase = get_supabase()
    res = supabase.table("tasks").update({"status": status}).eq("id", task_id).execute()
    return f"Task {task_id} updated to {status}"
