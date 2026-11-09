import { Card } from "actify";
import { type CritiqueRound } from "../../types";
import { Search, Database, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface EvidenceViewerProps {
  notes: string[];
  critiqueHistory: CritiqueRound[];
  currentQuery?: string;
  isRunning: boolean;
}

export function EvidenceViewer({
  notes,
  critiqueHistory,
  currentQuery,
  isRunning,
}: EvidenceViewerProps) {
  return (
    <Card
      variant="outlined"
      className="p-5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl min-h-[460px] flex flex-col space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            Grounding Evidence & Critique Logs
          </h2>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono">
          {notes.length} Evidence Chunks
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Latest Search Query */}
        {currentQuery && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-sky-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              <Search className="w-3.5 h-3.5" />
              <span>Current Search Formulation</span>
            </div>
            <p className="text-xs font-mono text-[var(--md-sys-color-on-surface)] bg-black/20 p-2 rounded">
              {currentQuery}
            </p>
          </div>
        )}

        {/* Critique Loop Reviews */}
        {critiqueHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Critic Sufficiency Reviews
            </h3>
            {critiqueHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  item.isSufficient
                    ? "border-emerald-800/50 bg-emerald-950/20 text-emerald-300"
                    : "border-rose-800/50 bg-rose-950/20 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {item.isSufficient ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                    )}
                    Round #{item.round}: {item.isSufficient ? "Sufficient" : "Insufficient (Triggered Revision)"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface)]">
                  {item.feedback}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Evidence Snippets */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            Extracted Evidence Chunks
          </h3>
          {notes.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
              {isRunning
                ? "Researcher node is fetching web evidence..."
                : "No evidence chunks retrieved yet."}
            </div>
          ) : (
            notes.map((note, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs text-[var(--md-sys-color-on-surface)] leading-relaxed space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                  <span>Chunk #{idx + 1}</span>
                  <span className="text-emerald-400 font-semibold">Grounding Ref</span>
                </div>
                <MarkdownRenderer content={note} />
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
