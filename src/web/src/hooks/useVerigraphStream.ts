import { useCallback, useState } from "react";
import { type NodeTraceLog, type JudgeScorecard, type CritiqueRound } from "../types";
import { agentStream } from "../api";

export function useVerigraphStream() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [traces, setTraces] = useState<NodeTraceLog[]>([]);
  const [finalReport, setFinalReport] = useState<string>("");
  const [judgeCard, setJudgeCard] = useState<JudgeScorecard | null>(null);
  const [researchNotes, setResearchNotes] = useState<string[]>([]);
  const [critiqueHistory, setCritiqueHistory] = useState<CritiqueRound[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [revisionCount, setRevisionCount] = useState<number>(0);
  const [mlflowRunId, setMlflowRunId] = useState<string>("");
  const [latency, setLatency] = useState<number | null>(null);
  const [accumulatedState, setAccumulatedState] = useState<Record<string, unknown>>({});

  const reset = useCallback(() => {
    setIsRunning(false);
    setActiveNode(null);
    setTraces([]);
    setFinalReport("");
    setJudgeCard(null);
    setResearchNotes([]);
    setCritiqueHistory([]);
    setCurrentQuery("");
    setRevisionCount(0);
    setMlflowRunId("");
    setLatency(null);
    setAccumulatedState({});
  }, []);

  const startStream = useCallback(
    async (task: string) => {
      if (!task.trim() || isRunning) return;

      setIsRunning(true);
      setActiveNode("planner");
      setTraces([]);
      setFinalReport("");
      setJudgeCard(null);
      setResearchNotes([]);
      setCritiqueHistory([]);
      setCurrentQuery("");
      setRevisionCount(0);
      setMlflowRunId("");
      setLatency(null);
      setAccumulatedState({});

      try {
        await agentStream(task, (message) => {
          const { event, data } = JSON.parse(message);
          if (event === "run_started") {
            setMlflowRunId(data.mlflow_run_id);
          } else if (event === "node_update") {
            const { node, update, revision_count } = data;
            setActiveNode(node);
            if (revision_count !== undefined) {
              setRevisionCount(revision_count);
            }

            setAccumulatedState((prev) => ({
              ...prev,
              [node]: update,
            }));

            let detail = "";
            let status: "ok" | "loop" = "ok";
            let rawQuery: string | undefined;
            let evidenceCount: number | undefined;

            if (node === "planner") {
              const query = update.current_query || "";
              const rev = update.revision_count ?? 1;
              rawQuery = query;
              setCurrentQuery(query);
              setRevisionCount(rev);
              detail = `Generated targeted query: "${query}" (Iteration #${rev})`;
            } else if (node === "researcher") {
              const notes = update.research_notes || [];
              evidenceCount = notes.length;
              if (notes.length > 0) {
                setResearchNotes((prev) => [...prev, ...notes]);
              }
              detail = `Retrieved and contextualized ${notes.length || 1} evidence snippet(s) from external sources.`;
            } else if (node === "critic") {
              status = update.is_sufficient ? "ok" : "loop";
              const feedback = update.critique_feedback || "";
              setCritiqueHistory((prev) => [
                ...prev,
                {
                  round: revision_count || prev.length + 1,
                  feedback,
                  isSufficient: update.is_sufficient,
                },
              ]);
              detail = update.is_sufficient
                ? `Evidence validated as sufficient. Advancing to Synthesizer.`
                : `Evidence insufficient (Loop triggered): ${feedback}`;
            } else if (node === "synthesizer") {
              detail = "Synthesized multi-source research report with citations.";
              setFinalReport(update.final_report || "");
            } else if (node === "judge") {
              const evalData = update.judge_evaluation;
              detail = `LLM-as-a-Judge completed quality audit (Score: ${evalData?.overall_score ?? "-"}/5.0).`;
              setJudgeCard(evalData);
            }

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
                rawQuery,
                evidenceCount,
                revisionCount: revision_count,
              },
            ]);
          } else if (event === "completed") {
            setLatency(data.latency_sec);
            setActiveNode(null);
          }
        });
      } catch (error) {
        console.error("Error during agent stream:", error);
      } finally {
        setIsRunning(false);
        setActiveNode(null);
      }
    },
    [isRunning],
  );

  return {
    isRunning,
    activeNode,
    traces,
    finalReport,
    judgeCard,
    researchNotes,
    critiqueHistory,
    currentQuery,
    revisionCount,
    mlflowRunId,
    latency,
    accumulatedState,
    startStream,
    reset,
  };
}
