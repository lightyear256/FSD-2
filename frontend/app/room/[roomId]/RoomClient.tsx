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

export function RoomClient({ roomId, userId }: RoomClientProps) {
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
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold">Room is Full</h1>
        <p className="text-gray-400">This room already has 2 participants.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!isJoined || !localStream) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center flex-col gap-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Setting up your camera & microphone…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-gray-950 text-white flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="h-12 px-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400 truncate max-w-[200px]">
              {roomId}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
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
      </div>

      <ChatPanel
        messages={messages}
        sendMessage={sendMessage}
        currentUserId={userId}
      />
    </div>
  );
}