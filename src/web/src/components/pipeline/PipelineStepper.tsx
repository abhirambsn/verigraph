import {
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Bot,
  Search,
  PenTool,
  Scale,
  Sparkles,
} from "lucide-react";

interface PipelineStepperProps {
  activeNode: string | null;
  traces: { node: string; status?: "ok" | "loop" }[];
  revisionCount?: number;
}

const NODES = [
  {
    id: "planner",
    step: "01",
    label: "Planner",
    icon: Bot,
    subtitle: "Query Formulation",
    desc: "Breaks task into search queries",
  },
  {
    id: "researcher",
    step: "02",
    label: "Researcher",
    icon: Search,
    subtitle: "Evidence Retrieval",
    desc: "Fetches grounded source chunks",
  },
  {
    id: "critic",
    step: "03",
    label: "Critic",
    icon: AlertTriangle,
    subtitle: "Sufficiency Check",
    desc: "Evaluates completeness & loops",
  },
  {
    id: "synthesizer",
    step: "04",
    label: "Synthesizer",
    icon: PenTool,
    subtitle: "Report Generation",
    desc: "Synthesizes multi-source report",
  },
  {
    id: "judge",
    step: "05",
    label: "Judge Audit",
    icon: Scale,
    subtitle: "Quality Benchmark",
    desc: "Audits faithfulness & clarity",
  },
];

export function PipelineStepper({
  activeNode,
  traces,
  revisionCount = 0,
}: PipelineStepperProps) {
  const loopCount = traces.filter((t) => t.status === "loop").length;

  return (
    <div className="w-full flex items-center justify-between gap-4">
      {/* Scrollable node ribbon (prevents any overflow squishing on smaller viewports) */}
      <div className="flex-1 overflow-x-auto scrollbar-none py-1">
        <div className="flex items-center gap-2 min-w-[780px] w-full">
          {NODES.map((n, i) => {
            const isActive = activeNode === n.id;
            const nodeTraces = traces.filter((t) => t.node === n.id);
            const latestTrace = nodeTraces[nodeTraces.length - 1];
            const isVisited = nodeTraces.length > 0;

            // Critic has passed if its latest outcome was ok or subsequent nodes executed
            const criticPassed =
              n.id === "critic" &&
              (latestTrace?.status === "ok" ||
                traces.some((t) => t.node === "synthesizer" || t.node === "judge"));

            // Critic is ONLY in 'looping' state if its latest check failed AND it hasn't passed yet
            const isCriticLooped =
              n.id === "critic" && latestTrace?.status === "loop" && !criticPassed;

            const Icon = n.icon;

            let statusText = "Pending";
            let statusBadge = "bg-slate-800/40 text-slate-500 border-slate-700/40";
            let cardStyle =
              "border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-lowest)]/80 text-[var(--md-sys-color-on-surface-variant)] opacity-60";

            if (isActive) {
              statusText = "Running";
              statusBadge = "bg-amber-400 text-slate-950 font-bold animate-pulse";
              cardStyle =
                "border-amber-400 bg-amber-500/10 text-[var(--md-sys-color-on-surface)] shadow-md shadow-amber-500/10 ring-1 ring-amber-400/80 opacity-100";
            } else if (isCriticLooped) {
              statusText = "Looping";
              statusBadge = "bg-rose-500/20 text-rose-300 border-rose-700/50";
              cardStyle =
                "border-rose-700/60 bg-rose-950/20 text-[var(--md-sys-color-on-surface)] opacity-100";
            } else if (isVisited) {
              statusText = n.id === "critic" && loopCount > 0 ? "Passed" : "Completed";
              statusBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-700/50";
              cardStyle =
                "border-emerald-600/40 bg-[var(--md-sys-color-surface-container-high)]/70 text-[var(--md-sys-color-on-surface)] opacity-100";
            }

            return (
              <div key={n.id} className="flex-1 flex items-center min-w-[155px]">
                {/* Node Box */}
                <div
                  className={`w-full p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${cardStyle}`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] opacity-50 font-bold">
                        {n.step}
                      </span>
                      <Icon className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                        {n.label}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border font-mono ${statusBadge}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] pt-0.5">
                    <span className="truncate">{n.subtitle}</span>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0 ml-1"></span>
                    ) : isCriticLooped ? (
                      <RotateCcw className="w-3 h-3 text-rose-400 animate-spin shrink-0 ml-1" />
                    ) : isVisited ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                    ) : null}
                  </div>
                </div>

                {/* Arrow to Next Node */}
                {i < NODES.length - 1 && (
                  <div className="px-1.5 text-[var(--md-sys-color-outline-variant)] shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revision Loop Status Chip */}
      {loopCount > 0 && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs shrink-0">
          <RotateCcw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
          <div className="leading-tight">
            <span className="font-bold text-[11px] block">Critic Revision Loop</span>
            <span className="text-[10px] opacity-80 font-mono">
              Attempt {loopCount} of 3
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
