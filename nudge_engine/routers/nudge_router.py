from fastapi import APIRouter, Header, HTTPException
from database.supabase_client import get_supabase
from config import get_settings

router = APIRouter(tags=["Nudges"])

async def verify_secret(x_engine_secret: str = Header(...)):
    settings = get_settings()
    if x_engine_secret != settings.engine_secret:
        raise HTTPException(status_code=403, detail="Invalid ENGINE_SECRET")

@router.get("/nudges/{workspace_id}")
async def list_nudges(workspace_id: str, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    supabase = get_supabase()
    res = (
        supabase.table("nudges")
        .select("*, projects!inner(workspace_id)")
        .eq("projects.workspace_id", workspace_id)
        .eq("dismissed", False)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data

@router.post("/nudges/{id}/dismiss")
async def dismiss_nudge(id: str, x_engine_secret: str = Header(...)):
    await verify_secret(x_engine_secret)
    supabase = get_supabase()
    res = supabase.table("nudges").update({"dismissed": True, "dismissed_at": "now"}).eq("id", id).execute()
    return {"status": "success", "message": f"Nudge {id} dismissed."}
