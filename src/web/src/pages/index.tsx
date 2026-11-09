import { useState } from "react";
import { LinearProgress } from "actify";
import { useVerigraphStream } from "../hooks/useVerigraphStream";
import { Header } from "../components/layout/Header";
import { QueryInputCard } from "../components/query/QueryInputCard";
import { PipelineStepper } from "../components/pipeline/PipelineStepper";
import { TraceFeed } from "../components/trace/TraceFeed";
import { JudgeScorecard } from "../components/evaluation/JudgeScorecard";
import { ReportViewer } from "../components/report/ReportViewer";
import { EvidenceViewer } from "../components/evidence/EvidenceViewer";
import { GraphDAGViewer } from "../components/graph/GraphDAGViewer";
import { FileText, ShieldCheck, Database, Code2, Network } from "lucide-react";

export function IndexPage() {
  const {
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
  } = useVerigraphStream();

  const [activeTab, setActiveTab] = useState<
    "report" | "judge" | "evidence" | "dag" | "state"
  >("report");

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] font-sans antialiased flex flex-col">
      {/* 1. Global Navigation Bar */}
      <Header
        mlflowRunId={mlflowRunId}
        latency={latency}
        isRunning={isRunning}
        activeNode={activeNode}
        onReset={reset}
      />

      {/* 2. Top Stream LinearProgress Shimmer */}
      {isRunning && (
        <LinearProgress
          isIndeterminate
          color="primary"
          className="h-0.5 w-full shrink-0"
        />
      )}

      {/* 3. Full-Width Top Pipeline Stepper Ribbon (No squishing, ample horizontal space) */}
      <div className="border-b border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-low)]/80 px-4 sm:px-6 py-2.5 shrink-0 z-10">
        <PipelineStepper
          activeNode={activeNode}
          traces={traces}
          revisionCount={revisionCount}
        />
      </div>

      {/* 4. Production Studio Dual-Pane Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: Prompt Console & Spacious Telemetry Stream */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)]/30 p-4 overflow-y-auto space-y-4 flex flex-col">
          {/* Query Console */}
          <QueryInputCard onRun={startStream} isRunning={isRunning} />

          {/* Live Node Transition Feed (Takes full remaining vertical space) */}
          <div className="flex-1 min-h-[360px] flex flex-col">
            <TraceFeed traces={traces} />
          </div>
        </aside>

        {/* RIGHT PANE: Canvas, LLM-as-a-Judge Audit & Grounding Hub */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--md-sys-color-background)]">
          {/* Canvas Sub-Header & Navigation Tabs */}
          <div className="h-12 border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)]/50 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "report"
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Verified Report</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("judge")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "judge"
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quality Audit</span>
                {judgeCard && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold ml-1">
                    {judgeCard.overall_score.toFixed(1)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "evidence"
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Grounding Evidence</span>
                {researchNotes.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] ml-1">
                    {researchNotes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("dag")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "dag"
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>LangGraph DAG</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("state")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "state"
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>State Diff</span>
              </button>
            </nav>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
              <span>LangGraph State Graph</span>
              <span>•</span>
              <span className="font-mono text-amber-400">v1.0.0</span>
            </div>
          </div>

          {/* Active Canvas Body (Scrollable Container) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === "report" && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {judgeCard && <JudgeScorecard card={judgeCard} />}
                <ReportViewer report={finalReport} isRunning={isRunning} />
              </div>
            )}

            {activeTab === "judge" && (
              <div className="max-w-4xl mx-auto">
                {judgeCard ? (
                  <JudgeScorecard card={judgeCard} />
                ) : (
                  <div className="p-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl">
                    <ShieldCheck className="w-10 h-10 opacity-20 mb-3 mx-auto text-amber-400" />
                    <h3 className="font-semibold text-sm text-[var(--md-sys-color-on-surface)] mb-1">
                      No Evaluation Audit Yet
                    </h3>
                    <p className="max-w-md mx-auto leading-relaxed opacity-70">
                      The Judge node automatically audits the synthesized report across Faithfulness, Relevance, and Clarity criteria upon research completion.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="max-w-4xl mx-auto">
                <EvidenceViewer
                  notes={researchNotes}
                  critiqueHistory={critiqueHistory}
                  currentQuery={currentQuery}
                  isRunning={isRunning}
                />
              </div>
            )}

            {activeTab === "dag" && (
              <div className="max-w-5xl mx-auto">
                <GraphDAGViewer
                  activeNode={activeNode}
                  traces={traces}
                  revisionCount={revisionCount}
                  accumulatedState={accumulatedState}
                />
              </div>
            )}

            {activeTab === "state" && (
              <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]/30">
                  <span className="font-bold text-[var(--md-sys-color-primary)]">
                    Accumulated LangGraph State Snapshot
                  </span>
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    {mlflowRunId ? `MLflow Run: ${mlflowRunId}` : "No Active Run"}
                  </span>
                </div>
                <pre className="p-3 bg-[var(--md-sys-color-surface-container-lowest)] rounded-xl overflow-x-auto text-emerald-400 text-[11px] leading-relaxed max-h-[500px]">
                  {JSON.stringify(accumulatedState, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
