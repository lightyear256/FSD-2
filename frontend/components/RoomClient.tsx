"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useChat } from "@/hooks/useChat";
import { MediaPanel } from "@/components/MediaPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { useSocket } from "@/app/context/SocketContext";

interface RoomClientProps {
  roomId: string;
  userId: string;
}

export default function RoomClient({ roomId, userId }: RoomClientProps) {
  const router = useRouter();
  const { isConnected, socket } = useSocket();

  const {
    localStream,
    remoteStream,
    isJoined,
    isRoomFull,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    cleanup,
  } = useWebRTC(roomId, userId);

  const { messages, sendMessage } = useChat(roomId, userId);

  useEffect(() => {
    return () => {
      cleanup?.();
      socket?.disconnect();
    };
  }, []);

  const handleLeaveRoom = () => {
    cleanup?.();
    socket?.disconnect();
    router.push("/dashboard");
  };

  if (isRoomFull) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Room status</p>
          <h1 className="mt-3 text-2xl font-medium text-white">Room is full</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">This room already has two participants. Please ask the interviewer for a new room link.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isJoined || !localStream) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border border-white/30 border-t-white" />
          <p className="mt-4 text-sm text-white/70">Setting up your camera and microphone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
        <section className="panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 sm:px-5">
            <div className="min-w-0">
              <p className="mono truncate text-xs text-white/55">{roomId}</p>
              <p className="text-xs text-white/45">1:1 interview room</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <MediaPanel
              localStream={localStream}
              remoteStream={remoteStream}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              toggleVideo={toggleVideo}
              toggleAudio={toggleAudio}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>
        </section>

        <ChatPanel messages={messages} sendMessage={sendMessage} currentUserId={userId} />
      </div>
    </div>
  );
}
