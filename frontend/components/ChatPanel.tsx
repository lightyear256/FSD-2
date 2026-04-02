"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  currentUserId: string;
}

export function ChatPanel({ messages, sendMessage, currentUserId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  return (
    <aside className="panel flex h-[44vh] w-full flex-shrink-0 flex-col overflow-hidden lg:h-full lg:w-[330px]">
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <h2 className="text-sm font-medium text-white">Chat</h2>
        {messages.length > 0 && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/60">
            {messages.length}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-sm text-white/45">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div key={i} className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                    isOwn
                      ? "rounded-br-sm bg-[var(--accent)] text-black"
                      : "rounded-bl-sm border border-white/10 bg-white/[0.03] text-white/85"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[11px] text-white/40">{isOwn ? "You" : "Peer"}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message"
            className="w-full rounded-full border border-white/15 bg-white/[0.02] px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </aside>
  );
}
