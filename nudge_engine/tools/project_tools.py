import uuid
from langchain_core.tools import tool
from database.supabase_client import get_supabase

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

@tool
def get_project_overview(project_id: str) -> str:
    """
    Get a high-level overview of a project, including active tasks and recent nudges.
    """
    if not is_valid_uuid(project_id):
        return f"Error: '{project_id}' is not a valid Project ID UUID. Please use list_projects to find valid IDs."

    supabase = get_supabase()
    try:
        tasks = supabase.table("tasks").select("count").eq("project_id", project_id).neq("status", "done").execute()
        nudges = supabase.table("nudges").select("*").eq("project_id", project_id).eq("dismissed", False).limit(5).execute()
        
        task_count = tasks.data[0]['count'] if tasks.data else 0
        return f"Project Overview for {project_id}: {task_count} active tasks. Recent nudges: {str(nudges.data)}"
    except Exception as e:
        return f"Error fetching project overview: {str(e)}"

@tool
def list_projects(workspace_id: str) -> str:
    """
    List all projects in a workspace.
    Use this to find Project IDs if only a project name is known.
    """
    if not is_valid_uuid(workspace_id):
        return f"Error: '{workspace_id}' is not a valid Workspace ID UUID."

    supabase = get_supabase()
    try:
        res = supabase.table("projects").select("id, name").eq("workspace_id", workspace_id).execute()
        return f"Projects in workspace {workspace_id}: {str(res.data)}"
    except Exception as e:
        return f"Error listing projects: {str(e)}"

@tool
def get_health_score(project_id: str) -> str:
    """
    Calculate a project health score based on stalled tasks and nudge density.
    """
    if not is_valid_uuid(project_id):
        return f"Error: '{project_id}' is not a valid Project ID UUID."

    supabase = get_supabase()
    try:
        stalled = supabase.table("tasks").select("count").eq("project_id", project_id).gt("stalled_days", 0).execute()
        total = supabase.table("tasks").select("count").eq("project_id", project_id).execute()
        
        stalled_count = stalled.data[0]["count"] if stalled.data else 0
        total_count = total.data[0]["count"] if total.data else 0

        score = 100
        if total_count > 0:
            score -= (stalled_count / total_count) * 50
            
        return f"Project Health Score for {project_id}: {max(0, score)}/100"
    except Exception as e:
        return f"Error calculating health score: {str(e)}"

@tool
def get_workspace_analytics(workspace_id: str) -> str:
    """
    Get a high-level summary of all nudges and stalled tasks in the entire workspace.
    """
    if not is_valid_uuid(workspace_id):
        return f"Error: '{workspace_id}' is not a valid Workspace ID UUID."

    supabase = get_supabase()
    try:
        nudges = (
            supabase.table("nudges")
            .select("projects!inner(workspace_id)", count="exact")
            .eq("projects.workspace_id", workspace_id)
            .execute()
        )
        stalled = (
            supabase.table("tasks")
            .select("projects!inner(workspace_id)", count="exact")
            .eq("projects.workspace_id", workspace_id)
            .gt("stalled_days", 0)
            .execute()
        )
        
        return f"Workspace Analytics for {workspace_id}: {nudges.count} total nudges, {stalled.count} stalled tasks across all projects."
    except Exception as e:
        return f"Error fetching workspace analytics: {str(e)}"
