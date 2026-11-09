from typing import Literal
from langgraph.graph import StateGraph, START, END
from verigraph.agent.state import AgentState
from verigraph.agent.nodes import planner_node, researcher_node, critic_node, synthesizer_node
from verigraph.evaluation.judge import judge_node

MAX_REVISIONS = 3

def route_after_critic(state: AgentState) -> Literal["planner", "synthesizer"]:
  if state.get("is_sufficient", False) or state.get("revision_count", 0) >= MAX_REVISIONS:
    return "synthesizer"
  return "planner"

def create_verigraph():
  workflow = StateGraph(AgentState)

  workflow.add_node("planner", planner_node)
  workflow.add_node("researcher", researcher_node)
  workflow.add_node("critic", critic_node)
  workflow.add_node("synthesizer", synthesizer_node)
  workflow.add_node("judge", judge_node)

  workflow.add_edge(START, "planner")
  workflow.add_edge("planner", "researcher")
  workflow.add_edge("researcher", "critic")
  workflow.add_conditional_edges(
    "critic",
    route_after_critic,
    {"planner": "planner", "synthesizer": "synthesizer"}
  )
  workflow.add_edge("synthesizer", "judge")
  workflow.add_edge("judge", END)

  return workflow.compile()

agent_graph = create_verigraph()
