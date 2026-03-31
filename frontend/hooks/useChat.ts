"use client";

import { useState, useEffect } from "react";
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

    const handleMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("chat-message", handleMessage);
    return () => { socket.off("chat-message", handleMessage); };
  }, [socket]);

  const sendMessage = (message: string) => {
    if (!socket || !message.trim()) return;
    setMessages((prev) => [...prev, { userId, message }]);
    socket.emit("chat-message", message);
  };

  return { messages, sendMessage };
}