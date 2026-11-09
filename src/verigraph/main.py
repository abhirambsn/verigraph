import json
import uuid
import mlflow
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from verigraph.core.config import init_mlflow, AGENT_MODEL_NAME, JUDGE_MODEL_NAME
from verigraph.agent.graph import agent_graph

init_mlflow()

app = FastAPI(title="VeriGraph Agent API", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

class ResearchRequest(BaseModel):
  task: str

@app.get("/health")
def health_check():
  return {
    "status": "ok",
    "agent_model": AGENT_MODEL_NAME,
    "judge_model": JUDGE_MODEL_NAME
  }

@app.post("/api/research/stream")
async def stream_research(req: ResearchRequest):
  run_id_short = str(uuid.uuid4())[:8]

  async def event_generator():
    initial_state = {
      "task": req.task,
      "current_query": "",
      "research_notes": [],
      "critique_feedback": "",
      "is_sufficient": False,
      "revision_count": 0,
      "final_report": "",
      "judge_evaluation": {}
    }

    start_time = time.time()

    with mlflow.start_run(run_name=f"VeriGraph-{run_id_short}") as active_run:
      mlflow.log_param("task", req.task)
      mlflow.log_param("agent_model", AGENT_MODEL_NAME)
      mlflow.log_param("judge_model", JUDGE_MODEL_NAME)

      yield {
        "event": "run_started",
        "data": json.dumps({"mlflow_run_id": active_run.info.run_id})
      }

      accumulated_state = dict(initial_state)

      async for step in agent_graph.astream(initial_state, stream_mode="updates"):
        for node_name, state_diff in step.items():
          accumulated_state.update(state_diff)
          payload = {
            "node": node_name,
            "update": state_diff,
            "revision_count": accumulated_state.get("revision_count", 0),
          }

          yield {
            "event": "node_update",
            "data": json.dumps(payload)
          }
      elapsed_time = round(time.time() - start_time, 2)
      judge_scores = accumulated_state.get("judge_evaluation", {})

      mlflow.log_metric("total_latency_sec", elapsed_time)
      mlflow.log_metric("revision_loops", accumulated_state.get("revision_count", 1))
      if judge_scores:
        mlflow.log_metric("judge_faithfulness", judge_scores.get("faithfulness_score", 0))
        mlflow.log_metric("judge_relevance", judge_scores.get("relevance_score", 0))
        mlflow.log_metric("judge_clarity", judge_scores.get("clarity_score", 0))
        mlflow.log_metric("judge_overall", judge_scores.get("overall_score", 0.0))
        mlflow.log_dict(judge_scores, "judge_scorecard.json")

      mlflow.log_text(accumulated_state.get("final_report", ""), "final_report.md")

      yield {
        "event": "completed",
        "data": json.dumps({
          "latency_sec": elapsed_time,
          "mlflow_run_id": active_run.info.run_id
        })
      }

  return EventSourceResponse(event_generator())
          