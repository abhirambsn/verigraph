import { Card } from "actify";
import { type JudgeScorecard as JudgeCardType } from "../../types";
import { ShieldCheck, Award, CheckCircle2, AlertTriangle, FileCheck2 } from "lucide-react";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

export function JudgeScorecard({ card }: { card: JudgeCardType }) {
  const isPassing = card.overall_score >= 4.0;
  const isMarginal = card.overall_score >= 3.0 && card.overall_score < 4.0;

  const metrics = [
    {
      label: "Faithfulness",
      desc: "Grounded in retrieved sources (no hallucinations)",
      score: card.faithfulness_score,
      pct: (card.faithfulness_score / 5) * 100,
      color: "bg-emerald-400",
    },
    {
      label: "Relevance",
      desc: "Direct alignment with the user's research query",
      score: card.relevance_score,
      pct: (card.relevance_score / 5) * 100,
      color: "bg-sky-400",
    },
    {
      label: "Clarity",
      desc: "Structured, cohesive synthesis and clarity of prose",
      score: card.clarity_score,
      pct: (card.clarity_score / 5) * 100,
      color: "bg-amber-400",
    },
  ];

  return (
    <Card
      variant="elevated"
      elevation={2}
      className="p-5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)]/40 rounded-2xl space-y-4"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                LLM-as-a-Judge Quality Audit
              </h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isPassing
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/50"
                    : isMarginal
                      ? "bg-amber-950/60 text-amber-300 border border-amber-700/50"
                      : "bg-rose-950/60 text-rose-300 border border-rose-700/50"
                }`}
              >
                {isPassing ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
                {isPassing ? "Passed Audit" : isMarginal ? "Marginal" : "Needs Revision"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Automated multi-criteria evaluation logged to MLflow artifacts
            </p>
          </div>
        </div>

        {/* Big Overall Score Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 px-3.5 py-1.5 rounded-xl">
          <Award className="w-5 h-5 text-amber-400" />
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Overall Rating
            </div>
            <div className="text-lg font-black text-amber-400 leading-tight">
              {card.overall_score.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Pillars with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-2"
          >
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                {m.label}
              </span>
              <span className="text-sm font-extrabold text-[var(--md-sys-color-primary)]">
                {m.score} <span className="text-[10px] text-slate-500 font-normal">/ 5</span>
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] overflow-hidden">
              <div
                className={`h-full rounded-full ${m.color} transition-all duration-500`}
                style={{ width: `${m.pct}%` }}
              />
            </div>

            <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-tight">
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Judge Reasoning Statement */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/50 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Judge Reasoning & Rationale</span>
        </div>
        <div className="text-xs text-[var(--md-sys-color-on-surface)] leading-relaxed">
          <MarkdownRenderer content={card.reasoning} />
        </div>
      </div>
    </Card>
  );
}
