import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  // If there's no newline and no language, it's inline code
  const isInline = !match && !codeString.includes("\n");

  if (isInline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[12px] border border-amber-400/25"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] shadow-md">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/30 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="uppercase text-[10px] font-bold tracking-wider">
            {lang || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto text-[12px] font-mono leading-relaxed text-slate-200">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body text-sm leading-relaxed text-[var(--md-sys-color-on-surface)] space-y-3 font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-amber-400 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2 pt-3 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-amber-300 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-1.5 pt-3 mb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-amber-200 pt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-amber-100 uppercase tracking-wider pt-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-[var(--md-sys-color-on-surface)] my-2">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1 my-2 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1 my-2 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-3 border-amber-400/80 bg-amber-500/10 px-4 py-2.5 rounded-r-xl italic text-amber-100 text-xs leading-relaxed">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 inline-flex items-center gap-0.5 transition"
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block opacity-70" />
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]/40">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--md-sys-color-surface-container-high)] text-amber-300 font-bold border-b border-[var(--md-sys-color-outline-variant)]/40">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-lowest)]/50">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--md-sys-color-surface-container-high)]/30 transition">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-300 leading-normal">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-[var(--md-sys-color-outline-variant)]/40" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
