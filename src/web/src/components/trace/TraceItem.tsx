import { type NodeTraceLog } from "../../types";
import {
  RotateCcw,
  CheckCircle2,
  Bot,
  Search,
  AlertTriangle,
  PenTool,
  Scale,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const NODE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    badgeBg: string;
    border: string;
  }
> = {
  planner: {
    icon: Bot,
    accentClass: "text-amber-400",
    badgeBg: "bg-amber-400/10 text-amber-300",
    border: "border-amber-500/30",
  },
  researcher: {
    icon: Search,
    accentClass: "text-sky-400",
    badgeBg: "bg-sky-400/10 text-sky-300",
    border: "border-sky-500/30",
  },
  critic: {
    icon: AlertTriangle,
    accentClass: "text-rose-400",
    badgeBg: "bg-rose-400/10 text-rose-300",
    border: "border-rose-500/30",
  },
  synthesizer: {
    icon: PenTool,
    accentClass: "text-indigo-400",
    badgeBg: "bg-indigo-400/10 text-indigo-300",
    border: "border-indigo-500/30",
  },
  judge: {
    icon: Scale,
    accentClass: "text-emerald-400",
    badgeBg: "bg-emerald-400/10 text-emerald-300",
    border: "border-emerald-500/30",
  },
};

export function TraceItem({ trace }: { trace: NodeTraceLog }) {
  const [expanded, setExpanded] = useState(false);
  const isLoop = trace.status === "loop";
  const config = NODE_CONFIG[trace.node] || NODE_CONFIG.planner;
  const Icon = config.icon;

  return (
    <div
      className={`p-2.5 rounded-lg border text-xs transition duration-150 ${
        isLoop
          ? "border-rose-800/60 bg-rose-950/25"
          : "border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)]"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`p-1 rounded-md ${config.badgeBg}`}>
            <Icon className="w-3 h-3" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--md-sys-color-on-surface)]">
            {trace.node}
          </span>
          {isLoop ? (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5 animate-spin" />
              Loopback
            </span>
          ) : (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Passed
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          {trace.timestamp}
        </span>
      </div>

      <p className="text-[11px] text-[var(--md-sys-color-on-surface)] leading-relaxed pl-1">
        {trace.detail}
      </p>

      {trace.rawQuery && (
        <div className="mt-1.5 pl-1 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/20 text-[10px] font-mono text-amber-300/80 truncate">
          Query: &ldquo;{trace.rawQuery}&rdquo;
        </div>
      )}
    </div>
  );
}
