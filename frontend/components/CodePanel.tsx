"use client";

import { useRef, useState, useCallback } from "react";
import { Copy, Check, Trash2 } from "lucide-react";

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodePanel({ code, onChange }: CodePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const lineCount = (code || "").split("\n").length;

  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: end } = ta;
    const next = code.substring(0, s) + "  " + code.substring(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleClear = () => {
    if (confirm("Clear the notepad?")) onChange("");
  };

  return (
    <div className="panel flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-5">
        <div>
          <p className="text-xs font-medium text-white/80">Code</p>
          <p className="mono text-xs text-white/40">
            {lineCount} {lineCount === 1 ? "line" : "lines"} · {code.length} chars
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy all"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-400" />
              : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleClear}
            title="Clear"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={lineNumbersRef}
          className="mono pointer-events-none flex-shrink-0 select-none overflow-hidden border-r border-white/[0.06] bg-white/[0.01] px-3 py-4 text-right text-xs leading-6 text-white/20"
          style={{ width: "3rem" }}
          aria-hidden
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          placeholder="// Write your solution here…"
          className="mono flex-1 resize-none bg-transparent py-4 pl-4 pr-4 text-xs leading-6 text-white/80 placeholder-white/20 caret-emerald-400 focus:outline-none"
          style={{
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
          }}
        />
      </div>
    </div>
  );
}
