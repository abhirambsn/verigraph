import operator
from typing import Annotated, List, TypedDict, Dict, Any

class AgentState(TypedDict):
  task: str
  current_query: str
  research_notes: Annotated[List[str], operator.add]
  critique_feedback: str
  is_sufficient: bool
  revision_count: int
  final_report: str
  judge_evaluation: Dict[str, Any]