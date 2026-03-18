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
    """
    supabase = get_supabase()
    data = {
        "project_id": project_id,
        "title": title,
        "description": description,
        "assignee_id": assignee_id,
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
