import { useEffect, useRef } from "react";
import { Card } from "actify";
import { type NodeTraceLog } from "../../types";
import { TraceItem } from "./TraceItem";
import { Terminal, Layers } from "lucide-react";

export function TraceFeed({ traces }: { traces: NodeTraceLog[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [traces]);

  return (
    <Card
      variant="outlined"
      className="p-3.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-xl flex flex-col flex-1 h-[420px] overflow-hidden"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--md-sys-color-outline-variant)]/30 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            State Transitions & Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
          {traces.length} Events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {traces.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--md-sys-color-on-surface-variant)] p-4">
            <Layers className="w-8 h-8 opacity-20 mb-2 text-amber-400" />
            <span className="font-medium">No Execution Traces</span>
            <span className="text-[10px] opacity-70 mt-0.5">
              Execute a prompt to observe real-time LangGraph node updates.
            </span>
          </div>
        ) : (
          traces.map((t) => <TraceItem key={t.id} trace={t} />)
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
