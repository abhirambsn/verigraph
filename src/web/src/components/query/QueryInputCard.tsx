import { useState, useRef, useEffect } from "react";
import { Card, Button } from "actify";
import { Play, Sparkles, CornerDownLeft, Loader2 } from "lucide-react";

interface QueryInputCardProps {
  onRun: (task: string) => void;
  isRunning: boolean;
}

const PRESET_QUERIES = [
  {
    tag: "LangGraph vs Chains",
    query: "Compare LangGraph cyclic state graphs with linear chains and explain how LLM-as-a-Judge improves reliability.",
  },
  {
    tag: "RAG Hallucinations",
    query: "Evaluate Hallucination mitigation strategies in Multi-hop Agentic RAG with iterative self-critique.",
  },
  {
    tag: "Loop Convergence",
    query: "How does Self-Correction in autonomous LLM loops prevent infinite reasoning cycles and model drift?",
  },
];

export function QueryInputCard({ onRun, isRunning }: QueryInputCardProps) {
  const [task, setTask] = useState(PRESET_QUERIES[0].query);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [task]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task.trim() || isRunning) return;
    onRun(task);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card
      variant="elevated"
      elevation={1}
      className="p-3.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-xl space-y-2.5"
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative rounded-lg border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-lowest)] focus-within:border-[var(--md-sys-color-primary)] transition p-2.5">
          <textarea
            ref={textareaRef}
            rows={2}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder="Describe the research objective or verification prompt..."
            className="w-full bg-transparent text-xs text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/50 resize-none outline-none leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]/20 mt-1">
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 font-mono">
              <CornerDownLeft className="w-2.5 h-2.5 text-amber-400" />
              <span>⌘ + Enter to execute</span>
            </span>

            <Button
              type="submit"
              variant="filled"
              color="primary"
              isDisabled={isRunning || !task.trim()}
              className="h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                  <span>Execute Graph</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mr-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            Templates:
          </span>
          {PRESET_QUERIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isRunning}
              onClick={() => setTask(item.query)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition cursor-pointer"
            >
              {item.tag}
            </button>
          ))}
        </div>
      </form>
    </Card>
  );
}
