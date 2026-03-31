"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface MediaPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  onLeaveRoom: () => void;
}

export function MediaPanel({
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  toggleVideo,
  toggleAudio,
  onLeaveRoom,
}: MediaPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg overflow-hidden relative">
      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
        {/* Remote Video (Main) */}
        <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <span className="text-xl">Waiting for remote user...</span>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="w-full md:w-1/3 bg-black rounded-lg relative flex items-center justify-center overflow-hidden shadow-lg border border-gray-700 md:shrink-0">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-500 text-sm">Loading media...</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 bg-gray-800 flex items-center justify-center gap-6">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
