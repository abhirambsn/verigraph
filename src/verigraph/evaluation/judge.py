import json
from pydantic import BaseModel, Field
from verigraph.core.config import get_openai_client, JUDGE_MODEL_NAME
from verigraph.agent.state import AgentState

class JudgeScorecard(BaseModel):
  faithfulness_score: int = Field(
    description="Score from 1 to 5 measuring if all claims in the report are grounded in the research notes."
  )

  relevance_score: int = Field(
    description="Score from 1 to 5 measuring how well the report answers the user's specific task."
  )

  clarity_score: int = Field(
    description="Score from 1 to 5 measuring structure, formatting, and readability."
  )

  reasoning: str = Field(
    description="Concise explanation justifying the assigned scores and pointing out any unsupported claims."
  )

JUDGE_SYSTEM_PROMPT = """
You are an impartial AI Quality Judge evaluating a research agent's final report.
You must grade the report strictly based on the provided Evidence (Research Notes) and the original User Task.

Rubric (1 to 5 integer scale):
- faithfulness_score (1-5): 1 = Heavy hallucination not found in notes; 5 = Every claim is grounded in the research notes.
- relevance_score (1-5): 1 = Off-topic or incomplete; 5 = Directly and thoroughly answers the User Task.
- clarity_score (1-5): 1 = Disorganized; 5 = Clear, well-structured Markdown.

Return ONLY a valid JSON object matching this exact schema:
{
  "faithfulness_score": <int 1-5>,
  "relevance_score": <int 1-5>,
  "clarity_score": <int 1-5>,
  "reasoning": "<string explanation>"
}
"""


def evaluate_report_with_judge(task: str, research_notes: list[str], final_report: str) -> dict:
  client = get_openai_client()
  evidence_text = "\n---\n".join(research_notes) if research_notes else "No notes gathered."

  user_content = (
    f"### USER TASK:\n{task}\n\n"
    f"### RETRIEVED RESEARCH NOTES (EVIDENCE):\n{evidence_text}\n\n"
    f"### AGENT FINAL REPORT:\n{final_report}"
  )

  response = client.chat.completions.create(
    model=JUDGE_MODEL_NAME,
    messages=[
      {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
      {"role": "user", "content": user_content}
    ],
    temperature=0.0,
    response_format={"type": "json_object"}
  )

  raw_json = response.choices[0].message.content
  try:
    parsed = json.loads(raw_json)
    validated = JudgeScorecard(**parsed)
    result = validated.model_dump()
  except Exception as e:
    result = {
      "faithfulness_score": 3,
      "relevance_score": 3,
      "clarity_score": 3,
      "reasoning": f"Fallback score (JSON parse warning: {str(e)})",
    }

  result["overall_score"] = round(
    (result["faithfulness_score"] + result["relevance_score"] + result["clarity_score"]) / 3.0,
    2
  )
  return result

def judge_node(state: AgentState) -> dict:
  scorecard = evaluate_report_with_judge(
    task=state["task"],
    research_notes=state.get("research_notes", []),
    final_report=state.get("final_report", "")
  )
  return {
    "judge_evaluation": scorecard
  }
