import { useState } from "react";
import type { JudgeScorecard, NodeTraceLog } from "./types";
import { agentStream } from "./api";

function App() {
  const [task, setTask] = useState(
    "Compare LangGraph cyclic state graphs with linear chains and explain how LLM-as-a-Judge improves reliability.",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [traces, setTraces] = useState<NodeTraceLog[]>([]);
  const [finalReport, setFinalReport] = useState<string>("");
  const [judgeCard, setJudgeCard] = useState<JudgeScorecard | null>(null);
  const [mlflowRunId, setMlflowRunId] = useState<string>("");
  const [latency, setLatency] = useState<number | null>(null);

  const startAgentStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || isRunning) return;

    setIsRunning(true);
    setActiveNode("planner");
    setTraces([]);
    setFinalReport("");
    setJudgeCard(null);
    setMlflowRunId("");
    setLatency(null);

    try {
      await agentStream(task, (message) => {
        const { event, data } = JSON.parse(message);
        if (event === "run_started") {
          setMlflowRunId(data.mlflow_run_id);
        } else if (event === "node_update") {
          const { node, update } = data;
          console.log('[DEBUG] Node Update:', node, update);
          setActiveNode(node);

          let detail = "";
          let status: "ok" | "loop" = "ok";

          if (node === "planner") {
            detail = `Generated search query: "${update.current_query}" (Attempt #${update.revision_count})`;
          } else if (node === "researcher") {
            detail = `Executed web_search_tool and appended ${update.research_notes?.length || 1} evidence chunk(s).`;
          } else if (node === "critic") {
            status = update.is_sufficient ? "ok" : "loop";
            detail = `${update.is_sufficient ? "Sufficient" : "Insufficient (Looping back to Planner)"}: ${update.critique_feedback}`;
          } else if (node === "synthesizer") {
            detail = "Synthesized verified Markdown report.";
            setFinalReport(update.final_report || "");
          } else if (node === "judge") {
            detail = `LLM-as-a-Judge completed audit (Overall: ${update.judge_evaluation?.overall_score}/5).`;
            setJudgeCard(update.judge_evaluation);
          }

          console.log('[DEBUG] Trace Log Update:', { node, detail, status });

          setTraces((prev) => [
            ...prev,
            {
              id:
                typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random()}`,
              node,
              timestamp: new Date().toLocaleTimeString(),
              detail,
              status,
            },
          ]);
        } else if (event === "completed") {
          setLatency(data.latency_sec);
          setActiveNode(null);
        }
      });
    } catch (error) {
      console.error("Stream Failed: ", error);
    } finally {
      setIsRunning(false);
      setActiveNode(null);
    }
  };

  const nodesOrder = [
    "planner",
    "researcher",
    "critic",
    "synthesizer",
    "judge",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              VeriGraph{" "}
              <span className="text-amber-400">
                Agentic Research & Judge Studio
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              LangGraph Cyclical State Machine • Ollama OpenAI SDK • MLflow
              LLM-as-a-Judge
            </p>
          </div>
          {mlflowRunId && (
            <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md text-slate-300">
              MLflow Run:{" "}
              <span className="font-mono text-amber-400">
                {mlflowRunId.slice(0, 10)}...
              </span>
              {latency && (
                <span className="ml-3 text-emerald-400">({latency}s)</span>
              )}
            </div>
          )}
        </header>

        {/* Prompt Input */}
        <form onSubmit={startAgentStream} className="flex gap-3">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter a complex technical research query..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isRunning}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-3 rounded-lg text-sm transition"
          >
            {isRunning ? "Running Graph..." : "Run Agent"}
          </button>
        </form>

        {/* Visual Node Pipeline Bar */}
        <div className="grid grid-cols-5 gap-2">
          {nodesOrder.map((n) => {
            const isCurrent = activeNode === n;
            const hasVisited = traces.some((t) => t.node === n);
            return (
              <div
                key={n}
                className={`p-3 rounded-lg border text-center uppercase text-xs font-bold tracking-wider transition ${
                  isCurrent
                    ? "border-amber-400 bg-amber-500/10 text-amber-300 animate-pulse"
                    : hasVisited
                      ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-500"
                }`}
              >
                {n}
              </div>
            );
          })}
        </div>

        {/* Main Workspace: Left Trace Log, Right Report + Judge Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Execution Trace Feed */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[560px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Live State Graph Transitions
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {traces.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  No active execution traces yet.
                </p>
              )}
              {traces.map((t) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-lg border text-xs ${
                    t.status === "loop"
                      ? "border-rose-800/60 bg-rose-950/20"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold uppercase text-amber-400">
                      {t.node}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {t.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{t.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Synthesized Report & Judge Scorecard */}
          <div className="lg:col-span-7 space-y-6">
            {/* LLM-as-a-Judge Scorecard */}
            {judgeCard && (
              <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    LLM-as-a-Judge Quality Audit
                  </h2>
                  <span className="text-sm font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">
                    Overall: {judgeCard.overall_score} / 5.0
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400">Faithfulness</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {judgeCard.faithfulness_score}/5
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400">Relevance</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {judgeCard.relevance_score}/5
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-400">Clarity</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {judgeCard.clarity_score}/5
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded border border-slate-800">
                  <strong className="text-slate-200">Judge Reasoning: </strong>
                  {judgeCard.reasoning}
                </p>
              </div>
            )}

            {/* Final Synthesized Output */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[360px]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Verified Synthesis Report
              </h2>
              {finalReport ? (
                <div className="prose prose-invert max-w-none text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {finalReport}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {isRunning
                    ? "Gathering evidence and verifying claims..."
                    : "Submit a query to generate a verified report."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
