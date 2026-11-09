import json, logging
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel
from verigraph.core.config import get_agent_llm
from verigraph.agent.state import AgentState
from verigraph.agent.tools import TOOLS, TOOLS_BY_NAME

class CritiqueGrade(BaseModel):
  is_sufficient: bool
  feedback: str

def planner_node(state: AgentState) -> dict:
  llm = get_agent_llm(temperature=0.2)
  task = state["task"]
  feedback = state.get("critique_feedback", "")
  revisions = state.get("revision_count", 0)

  sys_msg = (
    "You are a Search Planner. Output ONLY a concise, 3 to 6 word search query string "
    "(keywords only, no quotes, no conversational filler) to gather facts for the user's request."
  )
  user_msg = f"Task: {task}\n"
  if feedback:
    user_msg += f"Previous search lacked detail. Critic feedback: {feedback}\nGenerate a better search query:"

  res = llm.invoke([
    SystemMessage(content=sys_msg),
    HumanMessage(content=user_msg)
  ])

  clean_query = res.content.strip().strip('"').strip("'")
  return { "current_query": clean_query, "revision_count": revisions + 1 }

def researcher_node(state: AgentState) -> dict:
  llm = get_agent_llm(temperature=0.0).bind_tools(TOOLS)
  query = state["current_query"]

  ai_msg = llm.invoke([
    SystemMessage(content="Call `web_search_tool` with the given search query."),
    HumanMessage(content=f"Search Query: {query}")
  ])

  outputs = []
  if ai_msg.tool_calls:
    for call in ai_msg.tool_calls:
      tool_fn = TOOLS_BY_NAME.get(call["name"])
      if tool_fn:
        outputs.append(str(tool_fn.invoke(call["args"])))
  else:
    outputs.append(str(TOOLS_BY_NAME["web_search_tool"].invoke({"query": query})))

  return {"research_notes": outputs}

def critic_node(state: AgentState) -> dict:
  llm = get_agent_llm(temperature=0.0, json_mode=True)
  notes = "\n---\n".join(state.get("research_notes", []))

  sys_msg = (
    "You are a Research Critic. Check if the Research Notes contain specific facts "
    "to answer the User Task. Output strict JSON: "
    '{"is_sufficient": bool, "feedback": "what is missing or why it is sufficient"}'
  )

  res = llm.invoke([
    SystemMessage(content=sys_msg),
    HumanMessage(content=f"Task: {state['task']}\n\nNotes:\n{notes}")
  ])

  try:
    grade = CritiqueGrade(**json.loads(res.content))
  except:
    grade = CritiqueGrade(is_sufficient=True, feedback="Proceeding with gathered notes.")

  return {"is_sufficient": grade.is_sufficient, "critique_feedback": grade.feedback}

def synthesizer_node(state: AgentState) -> dict:
  llm = get_agent_llm(temperature=0.3)
  notes = "\n---\n".join(state.get("research_notes", []))

  sys_msg = (
    "You are a Senior Technical Analyst. Write a clear, well-structured Markdown report "
    "answering the User Task using ONLY the provided Research Notes. Cite sources inline."
  )

  res = llm.invoke([
    SystemMessage(content=sys_msg),
    HumanMessage(content=f"Task: {state['task']}\n\nResearch Notes:\n{notes}")
  ])

  return {"final_report": res.content}