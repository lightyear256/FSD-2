"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SocketProvider } from "@/app/context/SocketContext";
import { RoomClient } from "./RoomClient";

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // For MVP, generate a random user ID if they are not logged in
    // This allows testing the WebRTC connection easily
    const generatedId = "user_" + Math.random().toString(36).substring(2, 9);
    setUserId(generatedId);
  }, []);

  if (!userId || !roomId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading room...
      </div>
    );
  }

  return (
    <SocketProvider>
      <RoomClient roomId={roomId} userId={userId} />
    </SocketProvider>
  );
}
