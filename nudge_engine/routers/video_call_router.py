from fastapi import APIRouter, Header, HTTPException, Query
import jwt
import time
import uuid
from config import get_settings
from typing import Optional, Dict

router = APIRouter(prefix="/video", tags=["Video Call"])

async def verify_secret(x_engine_secret: str = Header(...)):
    settings = get_settings()
    if x_engine_secret != settings.engine_secret:
        raise HTTPException(status_code=403, detail="Invalid ENGINE_SECRET")

@router.get("/token")
async def get_video_token(
    room: str = Query(..., description="The room name to join"),
    identity: str = Query(..., description="The participant identity"),
    x_engine_secret: str = Header(...)
):
    await verify_secret(x_engine_secret)
    
    settings = get_settings()
    
    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(
            status_code=500, 
            detail="LiveKit API keys are not configured in the engine."
        )

    try:
        # Standard LiveKit JWT claims
        payload = {
            "exp": int(time.time()) + 3600, # 1 hour
            "iss": settings.livekit_api_key,
            "nbf": int(time.time()) - 1,
            "sub": identity,
            "jti": str(uuid.uuid4()),
            "video": {
                "room": room,
                "roomJoin": True,
            },
        }
        
        # Manually encode JWT using HS256 (required by LiveKit)
        token = jwt.encode(payload, settings.livekit_api_secret, algorithm="HS256")
        
        # PyJWT 2.0+ returns a string, but let's handle bytes just in case
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        return {"token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")
