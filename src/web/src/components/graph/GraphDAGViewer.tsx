import { useState } from "react";
import { Card } from "actify";
import {
  Bot,
  Search,
  AlertTriangle,
  PenTool,
  Scale,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";

interface GraphDAGViewerProps {
  activeNode: string | null;
  traces: { node: string; status?: "ok" | "loop"; detail: string }[];
  revisionCount?: number;
  accumulatedState?: Record<string, unknown>;
}

interface NodeMeta {
  id: string;
  title: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NODES: NodeMeta[] = [
  {
    id: "planner",
    title: "Planner Node",
    role: "Query Formulation",
    icon: Bot,
    description: "Analyzes user task, past critique feedback, and formulates targeted search queries.",
  },
  {
    id: "researcher",
    title: "Researcher Node",
    role: "Evidence Retrieval",
    icon: Search,
    description: "Executes web_search_tool and appends verified text chunks to research notes.",
  },
  {
    id: "critic",
    title: "Critic Node",
    role: "Sufficiency Verification",
    icon: AlertTriangle,
    description: "Evaluates whether research notes contain adequate factual grounding. Decides whether to proceed or loop.",
  },
  {
    id: "synthesizer",
    title: "Synthesizer Node",
    role: "Report Synthesis",
    icon: PenTool,
    description: "Aggregates evidence into an authoritative Markdown report with structured citations.",
  },
  {
    id: "judge",
    title: "Judge Node",
    role: "Quality Benchmark",
    icon: Scale,
    description: "LLM-as-a-Judge audits the report for Faithfulness, Relevance, and Clarity, logging scores to MLflow.",
  },
];

export function GraphDAGViewer({
  activeNode,
  traces,
  revisionCount = 0,
  accumulatedState = {},
}: GraphDAGViewerProps) {
  const [selectedNode, setSelectedNode] = useState<string>("planner");

  const selectedMeta = NODES.find((n) => n.id === selectedNode) || NODES[0];
  const nodeTraces = traces.filter((t) => t.node === selectedNode);
  const selectedState = accumulatedState[selectedNode];
  const loopCount = traces.filter((t) => t.status === "loop").length;

  return (
    <Card
      variant="outlined"
      className="p-5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl min-h-[520px] flex flex-col space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40 gap-2 shrink-0">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <span>LangGraph Cyclical State Machine DAG</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
              5 Nodes • 1 Conditional Loop Edge
            </span>
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Click any node below to inspect its LangGraph execution history and state payload
          </p>
        </div>

        {loopCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-950/50 border border-rose-800/60 text-rose-300">
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            <span>Critic Revision Loop #{loopCount}</span>
          </span>
        )}
      </div>

      {/* Interactive DAG Visual Diagram */}
      <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30 relative overflow-x-auto">
        {/* Conditional Loop Edge Annotation */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-1.5">
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>Conditional Loop: Critic ➔ Planner (if is_sufficient = False)</span>
        </div>

        <div className="flex items-center justify-between min-w-[760px] pt-6 pb-2">
          {NODES.map((n, i) => {
            const isActive = activeNode === n.id;
            const nodeTraces = traces.filter((t) => t.node === n.id);
            const latestTrace = nodeTraces[nodeTraces.length - 1];
            const isVisited = nodeTraces.length > 0;
            const isSelected = selectedNode === n.id;

            // Critic has passed if its latest outcome was ok or subsequent nodes executed
            const criticPassed =
              n.id === "critic" &&
              (latestTrace?.status === "ok" ||
                traces.some((t) => t.node === "synthesizer" || t.node === "judge"));

            // Critic is ONLY in 'looping' state if its latest check failed AND it hasn't passed yet
            const isCriticLooped =
              n.id === "critic" && latestTrace?.status === "loop" && !criticPassed;

            const Icon = n.icon;

            return (
              <div key={n.id} className="flex items-center gap-2 flex-1">
                {/* Node Box */}
                <button
                  type="button"
                  onClick={() => setSelectedNode(n.id)}
                  className={`flex-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "ring-2 ring-amber-400 shadow-lg shadow-amber-500/15"
                      : "hover:border-[var(--md-sys-color-outline)]"
                  } ${
                    isActive
                      ? "border-amber-400 bg-amber-500/15 text-amber-300 animate-pulse"
                      : isCriticLooped
                        ? "border-rose-700/60 bg-rose-950/30 text-rose-300"
                        : isVisited
                          ? "border-emerald-600/50 bg-[var(--md-sys-color-surface-container-high)] text-emerald-300"
                          : "border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-black/25">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </span>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    ) : isCriticLooped ? (
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                    ) : isVisited ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : null}
                  </div>

                  <div className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                    {n.title}
                  </div>
                  <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                    {n.role}
                  </div>
                </button>

                {/* Arrow Connector */}
                {i < NODES.length - 1 && (
                  <div className="text-[var(--md-sys-color-outline-variant)] px-1 shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Inspector Detail */}
      <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <selectedMeta.icon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                {selectedMeta.title} Inspector
              </h3>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                {selectedMeta.description}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
            {nodeTraces.length} Executions
          </span>
        </div>

        {/* Execution logs for this selected node */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Execution Logs ({selectedNode})
          </div>
          {nodeTraces.length === 0 ? (
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic p-2 bg-black/10 rounded">
              Node has not executed yet.
            </div>
          ) : (
            nodeTraces.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs flex justify-between items-start"
              >
                <span className="text-[var(--md-sys-color-on-surface)] leading-relaxed">
                  {t.detail}
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] shrink-0 ml-3">
                  {t.timestamp}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Raw state diff if available */}
        {selectedState && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              State Diff Output
            </div>
            <pre className="p-3 bg-black/30 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(selectedState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
