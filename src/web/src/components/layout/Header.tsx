import { Activity, Cpu, RotateCcw, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Button } from "actify";

interface HeaderProps {
  mlflowRunId?: string;
  latency?: number | null;
  isRunning?: boolean;
  onReset?: () => void;
  activeNode?: string | null;
}

export function Header({
  mlflowRunId,
  latency,
  isRunning,
  onReset,
  activeNode,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/10">
            <ShieldCheck className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)]">
              VeriGraph
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/50">
              Studio
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[var(--md-sys-color-outline-variant)]/50 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Cyclical State Machine • MLflow LLM-as-a-Judge</span>
        </div>
      </div>

      {/* Telemetry & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Model Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface-variant)]">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[11px]">llama3.2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* MLflow Run Badge */}
        {mlflowRunId ? (
          <div className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-[var(--md-sys-color-on-surface)]">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Run:</span>
            <span className="font-mono text-[11px] font-semibold text-amber-400">
              {mlflowRunId.slice(0, 8)}
            </span>
            {latency && (
              <span className="text-[11px] font-mono text-emerald-400 font-semibold pl-1 border-l border-amber-500/30">
                {latency}s
              </span>
            )}
          </div>
        ) : null}

        {/* Engine Status */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)]">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="font-medium text-[11px] text-[var(--md-sys-color-on-surface)]">
            {isRunning ? (
              <span className="text-amber-400 uppercase tracking-wider text-[10px] font-bold">
                {activeNode || "Executing"}...
              </span>
            ) : (
              "Idle"
            )}
          </span>
        </div>

        {/* Reset / Clear */}
        {onReset && (
          <Button
            variant="text"
            onPress={onReset}
            className="p-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] rounded-md transition"
            aria-label="Reset Workspace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}
