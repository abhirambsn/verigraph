import pandas as pd
import mlflow, logging
from mlflow.metrics import make_metric, MetricValue
from verigraph.core.config import init_mlflow, AGENT_MODEL_NAME, JUDGE_MODEL_NAME
from verigraph.agent.graph import agent_graph
from verigraph.evaluation.judge import evaluate_report_with_judge

def run_offline_evaluation():
  init_mlflow()

  eval_df = pd.DataFrame({
    "inputs": [
      "Explain how Server-Sent Events (SSE) differ from WebSockets in FastAPI.",
      "What is the role of conditional edges in LangGraph state machines?",
      "How does LLM-as-a-Judge evaluate faithfulness in RAG and agent workflows?"
    ]
  })


  def faithfulness_metric_fn(predictions, targets, metrics, **kwargs):
    scores = []
    justifications = []
    for pred, notes in zip(predictions, kwargs.get("research_context", [])):
      res = evaluate_report_with_judge(task="Benchmark query", research_notes=[notes], final_report=pred)
      scores.append(res["faithfulness_score"])
      justifications.append(res["reasoning"])

    return MetricValue(
      scores=scores,
      justifications=justifications,
      aggregate_results={"mean": sum(scores) / len(scores)}
    )

  faithfulness_metric = make_metric(
    eval_fn=faithfulness_metric_fn,
    greater_is_better=True,
    name="ollama_judge_faithfulness",
  )

  outputs = []
  contexts = []

  for query in eval_df["inputs"]:
    result = agent_graph.invoke({
        "task": query,
        "current_query": "",
        "research_notes": [],
        "critique_feedback": "",
        "is_sufficient": False,
        "revision_count": 0,
        "final_report": "",
        "judge_evaluation": {}
    })
    outputs.append(result["final_report"])
    contexts.append("\n".join(result["research_notes"]))

  eval_df["predictions"] = outputs
  eval_df["research_context"] = contexts

  with mlflow.start_run(run_name=f"Benchmark-{AGENT_MODEL_NAME}-Judge-{JUDGE_MODEL_NAME}"):
    results = mlflow.evaluate(
      data=eval_df,
      predictions="predictions",
      extra_metrics=[faithfulness_metric],
      evaluator_config={"col_mapping": {"research_context": "research_context"}}
    )
    logging.info("Benchmark Metrics: ", results.metrics)

if __name__ == '__main__':
  run_offline_evaluation()
