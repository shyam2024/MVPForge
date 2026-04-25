from langchain_groq import ChatGroq
import os
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from config.settings import settings
from typing import List, Dict, Any, Optional
import json
import re


def get_llm(temperature: float = 0.7):
    return ChatGroq(
        model=settings.AI_MODEL or "llama-3.1-8b-instant",
        temperature=temperature,
        groq_api_key=settings.GROQ_API_KEY
    )


def build_messages(history: List[Dict], new_message: str) -> List:
    messages = []
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=new_message))
    return messages


async def chat_completion(
    system_prompt: str,
    messages: List[Dict],
    new_message: str,
    temperature: float = 0.7,
) -> str:
    llm = get_llm(temperature)
    all_messages = [SystemMessage(content=system_prompt)] + build_messages(messages, new_message)
    response = await llm.ainvoke(all_messages)
    return response.content


async def structured_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
) -> Dict[str, Any]:
    """Returns parsed JSON from AI response."""
    llm = get_llm(temperature)
    full_system = system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation."
    messages = [
        SystemMessage(content=full_system),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    content = response.content.strip()
    # Strip markdown code blocks if present
    content = re.sub(r"```json\s*", "", content)
    content = re.sub(r"```\s*", "", content)
    return json.loads(content)


async def single_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
) -> str:
    llm = get_llm(temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    return response.content
