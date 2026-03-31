"use client";

import { useRouter } from "next/navigation";
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
  const { isConnected } = useSocket();
  const {
    localStream,
    remoteStream,
    isJoined,
    isRoomFull,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useWebRTC(roomId, userId);

  const { messages, sendMessage } = useChat(roomId, userId);

  const handleLeaveRoom = () => {
    router.push("/dashboard");
  };

  if (isRoomFull) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-500">Room is Full</h1>
        <p>This room already has 2 participants.</p>
        <button onClick={handleLeaveRoom} className="px-4 py-2 bg-blue-600 rounded">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row h-screen">
      <div className="flex-1 p-4 flex flex-col h-full min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Interview Room: {roomId}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800 flex flex-col">
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
