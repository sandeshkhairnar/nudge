import logging
import asyncio
import json
import re
from typing import Any, Dict, List, Optional, AsyncGenerator

from langchain_classic.agents import AgentExecutor, create_tool_calling_agent

from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from services.llm import get_llm
from agent.prompts import AGENT_PROMPT
from agent.memory import get_langchain_memory, save_langchain_memory
from tools.task_tools import get_tasks, create_task, update_task_status
from tools.nudge_tools import generate_nudge, flag_stalled
from tools.notify_tools import slack_notify, email_notify
from tools.message_tools import create_ai_message, analyze_message_context, create_system_message, NUDGE_BOT_ID
from tools.project_tools import list_projects, get_project_overview, get_health_score, get_workspace_analytics
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

FALLBACK_MESSAGE = (
    "⚠️ **Nudge AI is temporarily unavailable.**\n\n"
    "The AI service could not be reached right now — this may be due to a rate limit, "
    "subscription issue, or a temporary outage. Please try again in a moment.\n\n"
    "_Your message has been noted and the team has been tagged._"
)

def _extract_mentions(text: str) -> list[str]:
    """Extract all @username or @UUID style mentions from a message."""
    return re.findall(r'@([\w\-\.]+)', text or "")

async def _post_fallback_message(event: Dict[str, Any], error: Exception) -> None:
    """
    When the LLM/API is unavailable, post a friendly error message directly
    to the relevant channel via Supabase — no agent required.
    Preserves any @mentions so tagged people are still notified.
    """
    try:
        supabase = get_supabase()
        payload = event.get("payload", {})
        event_type = event.get("event_type", "")

        # Determine the channel to post into
        channel_id: str | None = None

        if event_type == "message":
            channel_id = payload.get("channel_id")
        elif event_type in ("chat", "stall", "github", "mom_generation"):
            project_id = event.get("project_id") or payload.get("project_id")
            if project_id:
                ch_res = (
                    supabase.table("channels")
                    .select("id")
                    .eq("project_id", project_id)
                    .order("created_at")
                    .limit(1)
                    .execute()
                )
                if ch_res.data:
                    channel_id = ch_res.data[0]["id"]

        if not channel_id:
            logger.warning("_post_fallback_message: could not resolve a channel_id, skipping.")
            return

        # Build fallback text — re-tag any mentioned users
        original_content = payload.get("content", payload.get("message", ""))
        mentions = _extract_mentions(original_content)
        mention_str = " ".join(f"@{m}" for m in mentions) if mentions else ""
        full_text = f"{mention_str}\n{FALLBACK_MESSAGE}".strip()

        supabase.table("messages").insert({
            "channel_id": channel_id,
            "content": full_text,
            "is_ai": True,
            "user_id": NUDGE_BOT_ID,
        }).execute()

        logger.info(f"Fallback message posted to channel {channel_id}")
    except Exception as fallback_err:
        logger.error(f"Failed to post fallback message: {fallback_err}")

# List of all tools available to the agent
TOOLS = [
    get_tasks,
    create_task,
    update_task_status,
    generate_nudge,
    flag_stalled,
    slack_notify,
    email_notify,
    create_ai_message,
    analyze_message_context,
    create_system_message,
    list_projects,
    get_project_overview,
    get_health_score,
    get_workspace_analytics
]

async def run_agent(event: Dict[str, Any]) -> str:
    """
    Main entry point for the AI agent.
    Takes an event (Dict), constructs the agent, runs it, and returns the result.
    """
    workspace_id = event.get("workspace_id")
    event_type = event.get("event_type")
    project_id = event.get("project_id")
    payload = event.get("payload", {})

    if not workspace_id:
        return "Error: No workspace_id provided in event."

    logger.info(f"Running agent for event: {event_type} (Workspace: {workspace_id})")

    # 1. Initialize LLM
    llm = get_llm()

    # 2. Setup Memory
    memory = await get_langchain_memory(workspace_id)

    # 3. Create Agent
    agent = create_tool_calling_agent(llm, TOOLS, AGENT_PROMPT)
    
    agent_executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        memory=memory,
        verbose=True,
        max_iterations=5,
        handle_parsing_errors=True
    )

def prepare_agent_input(event: Dict[str, Any]) -> str:
    """
    Constructs a consistent, context-rich prompt for the agent.
    """
    workspace_id = event.get("workspace_id")
    project_id = event.get("project_id")
    event_type = event.get("event_type")
    payload = event.get("payload", {})
    
    context_prefix = f"CONTEXT: Workspace ID: {workspace_id}, Project ID: {project_id or 'N/A'}. Use these IDs for all tool calls.\n"
    
    if event_type == "message":
        user_msg = payload.get("content", "")
        channel_id = payload.get("channel_id", "")
        return context_prefix + (
            f"A user mentioned @nudge in channel {channel_id} and asked: '{user_msg}'. "
            f"Answer their question thoughtfully using available tools if needed. "
            f"You MUST call 'create_system_message' with system_type='chat' to post your reply directly in channel {channel_id}. "
            "Keep your response concise, friendly, and professional."
        )
    elif event_type == "stall":
        return context_prefix + (
            f"STALL ALERT: Task '{payload.get('task_title')}' (ID: {payload.get('task_id')}) "
            "has been stalled for 8 days. "
            "1. Generate a premium, context-aware nudge using 'generate_nudge' for the dashboard. "
            "2. Post a professional system alert to the project chat using 'create_system_message'. "
            "Be encouraging but firm about project velocity."
        )
    elif event_type == "github":
        return context_prefix + (
            f"GitHub event '{payload.get('event_name')}' received for repo {payload.get('repository')}. Details: {payload.get('data')}. "
            "You MUST process this update and use the 'create_system_message' tool to post a summary to the project chat, "
            "EVEN IF it is just a 'ping' or setup event."
        )
    elif event_type == "mom_generation":
        project_name = payload.get("project_name", payload.get("room_name"))
        return context_prefix + (
            f"MEETING ENDED: The meeting for project/room '{project_name}' has ended. "
            f"Here is the continuous raw transcript and chat log:\n---\n{payload.get('transcript')}\n---\n"
            "Please analyze this transcript text. Synthesize it into a structured 'Minute of Meeting' (MOM) "
            "containing a short Summary, Key Decisions, and Action Items. "
            "Then, you MUST use the 'create_system_message' tool to post this MOM as a system alert to the project chat so everyone is informed. "
            "IMPORTANT: When calling create_system_message, use the argument `system_type='system_mom'`. "
            "Format the text beautifully with Markdown and emojis for readability."
        )
    elif event_type == "chat":
        user_query = payload.get("message", payload.get("content", ""))
        return context_prefix + f"DASHBOARD CHAT: The user says: '{user_query}'. Answer their question about their workspace or projects using available tools."
    else:
        return context_prefix + f"INPUT: {str(payload)}"

async def run_agent(event: Dict[str, Any]) -> str:
    """
    Main entry point for the AI agent.
    Takes an event (Dict), constructs the agent, runs it, and returns the result.
    """
    workspace_id = event.get("workspace_id")
    event_type = event.get("event_type")

    if not workspace_id:
        return "Error: No workspace_id provided in event."

    logger.info(f"Running agent for event: {event_type} (Workspace: {workspace_id})")

    # 1. Initialize LLM
    llm = get_llm()

    # 2. Setup Memory
    memory = await get_langchain_memory(workspace_id)

    # 3. Create Agent
    agent = create_tool_calling_agent(llm, TOOLS, AGENT_PROMPT)
    
    agent_executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        memory=memory,
        verbose=True,
        max_iterations=5,
        handle_parsing_errors=True
    )

    # 4. Prepare Input
    input_text = prepare_agent_input(event)

    # 5. Execute Agent
    try:
        logger.info(f"Agent Input Text: {input_text}")
        result = await agent_executor.ainvoke({"input": input_text})
        logger.info(f"Agent Raw Result: {result}")
        
        # 6. Save Memory
        await save_langchain_memory(workspace_id, memory)
        
        return result.get("output", "Agent completed without output.")
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        await _post_fallback_message(event, e)
        return FALLBACK_MESSAGE

async def run_agent_stream(event: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """
    Streaming version of run_agent.
    Yields tokens from the LLM response.
    """
    workspace_id = event.get("workspace_id")
    event_type = event.get("event_type")
    payload = event.get("payload", {})

    if not workspace_id:
        yield "Error: No workspace_id provided."
        return

    # 1. Initialize LLM (Streaming)
    llm = get_llm(streaming=True)

    # 2. Setup Memory
    memory = await get_langchain_memory(workspace_id)

    # 3. Create Agent
    agent = create_tool_calling_agent(llm, TOOLS, AGENT_PROMPT)
    agent_executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        memory=memory,
        max_iterations=5,
        handle_parsing_errors=True
    )

    # 4. Input
    input_text = prepare_agent_input(event)

    # 5. Stream
    try:
        async for stream_event in agent_executor.astream_events(
            {"input": input_text},
            version="v2"
        ):
            kind = stream_event["event"]
            if kind == "on_chat_model_stream":
                content = stream_event["data"]["chunk"].content
                if content:
                    if isinstance(content, list):
                        content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
                    yield str(content)
                    
        # Save memory at end
        await save_langchain_memory(workspace_id, memory)
        
    except Exception as e:
        logger.error(f"Streaming agent failed: {e}")
        await _post_fallback_message(event, e)
        yield FALLBACK_MESSAGE
