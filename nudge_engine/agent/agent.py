import logging
import asyncio
import json
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
from tools.message_tools import create_ai_message, analyze_message_context, create_system_message
from tools.project_tools import list_projects, get_project_overview, get_health_score, get_workspace_analytics

logger = logging.getLogger(__name__)

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

    # 4. Prepare Input based on event type
    # Inject IDs into the prompt to prevent hallucination
    context_prefix = f"CONTEXT: Workspace ID: {workspace_id}, Project ID: {project_id or 'N/A'}. Use these IDs for all tool calls.\n"

    if event_type == "message":
        user_msg = payload.get("content", "")
        input_text = context_prefix + f"A user sent a message in channel {payload.get('channel_id')}: '{user_msg}'. Analyze if this is a task request or needs a reply."
    elif event_type == "stall":
        input_text = context_prefix + (
            f"STALL ALERT: Task '{payload.get('task_title')}' (ID: {payload.get('task_id')}) "
            "has been stalled for 8 days. "
            "1. Generate a premium, context-aware nudge using 'generate_nudge' for the dashboard. "
            "2. Post a professional system alert to the project chat using 'create_system_message'. "
            "Be encouraging but firm about project velocity."
        )
    elif event_type == "github":
        input_text = context_prefix + f"GitHub event {payload.get('event_name')} received for repo {payload.get('repository')}. Details: {payload.get('data')}. Process this update."
    else:
        input_text = context_prefix + str(payload)

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
        return f"Agent error: {str(e)}"

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
    input_text = str(payload) if event_type == "chat" else str(payload)

    # 5. Stream
    try:
        async for event in agent_executor.astream_events(
            {"input": input_text},
            version="v2"
        ):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    if isinstance(content, list):
                        content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
                    yield str(content)
                    
        # Save memory at end
        await save_langchain_memory(workspace_id, memory)
        
    except Exception as e:
        logger.error(f"Streaming agent failed: {e}")
        yield f"Error: {str(e)}"
