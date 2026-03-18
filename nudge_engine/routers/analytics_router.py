from fastapi import APIRouter, Header, HTTPException
from database.supabase_client import get_supabase
from config import get_settings
from tools.project_tools import get_health_score

router = APIRouter(tags=["Analytics"])

async def verify_secret(x_engine_secret: str = Header(...)):
    settings = get_settings()
    if x_engine_secret != settings.engine_secret:
        raise HTTPException(status_code=403, detail="Invalid ENGINE_SECRET")

@router.get("/analytics/{workspace_id}")
async def get_workspace_analytics(workspace_id: str, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    # Placeholder for complex analytics; for now, return generic stats
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
    
    return {
        "workspace_id": workspace_id,
        "nudge_count": nudges.count,
        "stalled_task_count": stalled.count
    }

@router.get("/analytics/project/{project_id}/health")
async def get_project_health(project_id: str, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    return {"project_id": project_id, "health": get_health_score.invoke(project_id)}
