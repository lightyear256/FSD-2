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
    <div className="w-full md:w-72 lg:w-80 flex flex-col border-t md:border-t-0 md:border-l border-gray-800 bg-gray-950 h-56 md:h-full flex-shrink-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-gray-800 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">Chat</h2>
        {messages.length > 0 && (
          <span className="ml-2 text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-sm text-center mt-8">
            No messages yet
          </p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div
                key={i}
                className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[11px] text-gray-600">
                  {isOwn ? "You" : "Peer"}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message…"
            className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2 outline-none placeholder-gray-600 focus:ring-1 focus:ring-blue-500 transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}