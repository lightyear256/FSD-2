"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";

export interface ChatMessage {
  userId: string;
  message: string;
}

export function useChat(roomId: string, userId: string) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (!socket || !message.trim()) return;

    // Optimistically add to local state
    const newMsg = { userId, message };
    setMessages((prev) => [...prev, newMsg]);

    // Send to backend
    socket.emit("chat-message", message);
  }, [socket, userId]);

  return {
    messages,
    sendMessage,
  };
}
