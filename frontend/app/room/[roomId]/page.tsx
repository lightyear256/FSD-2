"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SocketProvider } from "@/app/context/SocketContext";
import RoomClient from "@/components/RoomClient";

export default function RoomPage() {
  const params = useParams();

  const roomId = useMemo(() => {
    if (!params?.roomId) return null;
    return Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  }, [params]);

  const [userId] = useState(() => "user_" + Math.random().toString(36).substring(2, 9));

  if (!roomId) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel rounded-xl px-6 py-4 text-sm text-white/70">Invalid room</div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <RoomClient roomId={roomId} userId={userId} />
    </SocketProvider>
  );
}
