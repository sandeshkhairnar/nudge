from fastapi import APIRouter, Header, HTTPException, UploadFile, File
import json
from services.llm import get_fast_llm
from config import get_settings
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/task", tags=["Task"])

async def verify_secret(x_engine_secret: str = Header(...)):
    settings = get_settings()
    if x_engine_secret != settings.engine_secret:
        raise HTTPException(status_code=403, detail="Invalid ENGINE_SECRET")

@router.post("/extract")
async def extract_task(
    file: UploadFile = File(...),
    x_engine_secret: str = Header(...)
):
    logger.info(f"[Magic Extract] Received file: {file.filename} (content_type: {file.content_type})")
    await verify_secret(x_engine_secret)
    content = await file.read()
    
    # Determine content type
    is_text = False
    try:
        text_content = content.decode('utf-8')
        is_text = True
    except Exception:
        text_content = "File content could not be read as plain text. Assuming it's binary or unsupported."

    from datetime import datetime
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    system_prompt = f"""You are an expert Project Manager. Analyze the following document and extract a list of tasks.
Current Date: {current_date}. 
If timelines or days are mentioned, calculate the `due_date` (YYYY-MM-DD) for tasks and subtasks starting from the current date.
Output ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks.
{{
  "tasks": [
    {{
      "title": "Concise task title",
      "description": "Detailed summary of the work",
      "type": "task",
      "priority": "medium",
      "due_date": "YYYY-MM-DD",
      "subtasks": [
        {{
          "title": "Subtask 1",
          "priority": "medium",
          "due_date": "YYYY-MM-DD"
        }}
      ]
    }}
  ]
}}"""
    
    if is_text:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=text_content)
        ]
    else:
        import base64
        b64_data = base64.b64encode(content).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=[
                {"type": "text", "text": "Extract task from this file:"},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_data}"}}
            ])
        ]
    
    try:
        logger.info("[Magic Extract] Starting extraction using LLM...")
        llm = get_fast_llm()
        response = await llm.ainvoke(messages)
        out_text = response.content.strip()
        
        logger.info(f"=== MAGIC EXTRACT RAW OUTPUT ===\n{out_text}\n================================")
        
        # Clean up any markdown blocks around json
        if out_text.startswith("```json"):
            out_text = out_text[7:]
        if out_text.startswith("```"):
            out_text = out_text[3:]
        if out_text.endswith("```"):
            out_text = out_text[:-3]
            
        data = json.loads(out_text.strip())
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Failed to extract task: {e}")
        return {"status": "error", "message": "Failed to parse LLM output"}
