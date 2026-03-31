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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="relative w-full h-full bg-gray-950 flex items-center justify-center overflow-hidden">
      {/* ── Remote video / waiting state ── */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 select-none">
          <div className="w-24 h-24 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium">Waiting for remote user…</p>
          <div className="flex gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Local video PiP ── */}
      <div className="absolute bottom-20 right-4 w-44 h-28 rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-800">
        {/* Always attach stream so tracks stay alive */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {/* Overlay when video is off */}
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="w-7 h-7 text-gray-400" />
          </div>
        )}
        <span className="absolute bottom-1 left-2 text-[11px] text-white/80 font-medium">
          You
        </span>
      </div>

      {/* ── Controls ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <ControlButton
          active={isAudioEnabled}
          onClick={toggleAudio}
          icon={isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          label={isAudioEnabled ? "Mute" : "Unmute"}
        />
        <ControlButton
          active={isVideoEnabled}
          onClick={toggleVideo}
          icon={isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          label={isVideoEnabled ? "Stop video" : "Start video"}
        />
        <button
          onClick={onLeaveRoom}
          title="Leave room"
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center transition-all shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
        active
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-red-600/90 hover:bg-red-500"
      }`}
    >
      {icon}
    </button>
  );
}