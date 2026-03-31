"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SocketProvider } from "@/app/context/SocketContext";
import { RoomClient } from "./RoomClient";

export default function RoomPage() {
  const params = useParams();

  const roomId = useMemo(() => {
    if (!params?.roomId) return null;
    return Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  }, [params]);

  const [userId] = useState(
    () => "user_" + Math.random().toString(36).substring(2, 9)
  );

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Invalid room
      </div>
    );
  }

  return (
    <SocketProvider>
      <RoomClient roomId={roomId} userId={userId} />
    </SocketProvider>
  );
}