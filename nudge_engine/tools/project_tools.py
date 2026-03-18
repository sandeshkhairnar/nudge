from langchain_core.tools import tool
from database.supabase_client import get_supabase

@tool
def get_project_overview(project_id: str) -> str:
    """
    Get a high-level overview of a project, including active tasks and recent nudges.
    """
    supabase = get_supabase()
    tasks = supabase.table("tasks").select("count").eq("project_id", project_id).neq("status", "done").execute()
    nudges = supabase.table("nudges").select("*").eq("project_id", project_id).eq("dismissed", False).limit(5).execute()
    
    return f"Project Overview: {tasks.data[0]['count']} active tasks. Recent nudges: {str(nudges.data)}"

@tool
def list_projects(workspace_id: str) -> str:
    """
    List all projects in a workspace.
    Use this to find Project IDs if only a project name is known.
    """
    supabase = get_supabase()
    res = supabase.table("projects").select("id, name").eq("workspace_id", workspace_id).execute()
    return f"Projects in workspace {workspace_id}: {str(res.data)}"

@tool
def get_health_score(project_id: str) -> str:
    """
    Calculate a project health score based on stalled tasks and nudge density.
    """
    supabase = get_supabase()
    # Stalled if stalled_days > 0
    stalled = supabase.table("tasks").select("count").eq("project_id", project_id).gt("stalled_days", 0).execute()
    total = supabase.table("tasks").select("count").eq("project_id", project_id).execute()
    
    score = 100
    if total.data[0]["count"] > 0:
        score -= (stalled.data[0]["count"] / total.data[0]["count"]) * 50
        
    return f"Project Health Score: {max(0, score)}/100"

@tool
def get_workspace_analytics(workspace_id: str) -> str:
    """
    Get a high-level summary of all nudges and stalled tasks in the entire workspace.
    Use this for general questions like 'How is my workspace doing?' or 'Overview of things'.
    """
    supabase = get_supabase()
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
    
    return f"Workspace Analytics: {nudges.count} total nudges, {stalled.count} stalled tasks across all projects."
