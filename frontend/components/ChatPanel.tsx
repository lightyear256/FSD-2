"use client";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useState, useRef, useEffect } from "react";
import { Send, X, Smile } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  currentUserId: string;
  onClose?: () => void;
}

export function ChatPanel({ messages, sendMessage, currentUserId, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-white/70">In-call messages</h2>
          {messages.length > 0 && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/50">
              {messages.length}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            title="Close chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      {/* Notice — messages only visible during call */}
      <div className="flex-shrink-0 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2">
        <p className="text-[11px] leading-relaxed text-white/30">
          Messages are only visible to people in the call and are deleted when the call ends.
        </p>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="pt-6 text-center text-xs text-white/35">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div key={i} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                <span className="px-1 text-[10px] text-white/35">{isOwn ? "You" : "Peer"}</span>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-1.5 text-sm leading-snug break-words ${
                    isOwn
                      ? "rounded-br-sm bg-white text-black"
                      : "rounded-bl-sm border border-white/10 bg-white/[0.05] text-white/85"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-white/[0.07] p-3">
        {showEmojis && (
          <div ref={emojiRef} className="mb-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={350}
              theme={"dark" as any}
            />
          </div>
        )}
        <div className="flex items-center gap-2">

          <button
            onClick={() => setShowEmojis((prev) => !prev)}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 cursor-pointer ${
              showEmojis ? "text-white/80" : "text-white/40"
            }`}
            title="Emojis"
          >
            <Smile className="h-4 w-4" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a message…"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
