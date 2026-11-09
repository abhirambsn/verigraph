import { useState, useMemo } from "react";
import { Card, Button } from "actify";
import { Copy, Check, Download, FileText, Clock, BookOpen } from "lucide-react";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface ReportViewerProps {
  report: string;
  isRunning: boolean;
}

export function ReportViewer({ report, isRunning }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    if (!report) return { words: 0, readTimeMin: 0 };
    const words = report.trim().split(/\s+/).length;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));
    return { words, readTimeMin };
  }, [report]);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verigraph-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      variant="outlined"
      className="p-5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl min-h-[460px] flex flex-col"
    >
      {/* Document Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[var(--md-sys-color-outline-variant)]/40 gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Verified Synthesis Document
            </h2>
            {report && (
              <div className="flex items-center gap-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {stats.readTimeMin} min read
                </span>
                <span>•</span>
                <span>{stats.words} words</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {report && (
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onPress={handleDownload}
              className="text-xs px-2.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)]/50 text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 cursor-pointer hover:border-amber-400 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </Button>
            <Button
              variant="tonal"
              color="primary"
              onPress={handleCopy}
              className="text-xs px-2.5 py-1 rounded-lg text-slate-950 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Document Body with MarkdownRenderer */}
      <div className="flex-1 overflow-y-auto pr-1">
        {report ? (
          <article className="max-w-none text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed font-sans">
            <MarkdownRenderer content={report} />
          </article>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-[var(--md-sys-color-on-surface-variant)]">
            <BookOpen className="w-10 h-10 opacity-20 mb-3 text-amber-400" />
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
              {isRunning
                ? "Autonomous Research & Synthesis in Progress"
                : "No Research Report Generated Yet"}
            </h3>
            <p className="text-xs max-w-md leading-relaxed opacity-70">
              {isRunning
                ? "The Planner is querying sources, Researcher is gathering evidence chunks, and Critic is testing for sufficiency before final synthesis."
                : "Choose a prompt template on the left or enter a custom technical query to begin multi-step research and evaluation."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
