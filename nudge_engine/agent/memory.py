import json
from typing import Any, List

from langchain_classic.memory import ConversationBufferWindowMemory
from langchain_core.messages import BaseMessage, message_to_dict, messages_from_dict

from services.redis_service import get_memory, set_memory
from config import get_settings

class RedisBackedMemory(ConversationBufferWindowMemory):
    """
    Custom LangChain memory that persists to Redis per workspace.
    """
    workspace_id: str

    def load_memory_variables(self, inputs: dict[str, Any]) -> dict[str, Any]:
        # Implementation depends on how we want to hook into LangChain's memory flow
        # In this simplistic version, we'll manually handle load/save in the agent loop.
        return super().load_memory_variables(inputs)

async def get_langchain_memory(workspace_id: str) -> ConversationBufferWindowMemory:
    """
    Factory to load a workspace's history from Redis into a LangChain memory object.
    """
    settings = get_settings()
    
    # Load from Redis
    turns = await get_memory(workspace_id)
    
    memory = ConversationBufferWindowMemory(
        memory_key="chat_history",
        return_messages=True,
        k=settings.memory_window_k,
        output_key="output"
    )
    
    if turns:
        memory.chat_memory.add_messages(messages_from_dict(turns))
    
    return memory

async def save_langchain_memory(workspace_id: str, memory: ConversationBufferWindowMemory) -> None:
    """
    Save the LangChain memory history back to Redis.
    """
    messages = memory.chat_memory.messages
    turns = [message_to_dict(m) for m in messages]
    await set_memory(workspace_id, turns)
