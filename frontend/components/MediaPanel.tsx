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
    <div className="relative h-full w-full overflow-hidden bg-[#0a0c0f]">
      {remoteStream ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/75">
            P
          </div>
          <p className="mt-4 text-sm font-medium text-white/80">Peer is joining...</p>
          <p className="mt-1 text-xs text-white/50">Connection is active. Video will appear shortly.</p>
        </div>
      )}

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/75 backdrop-blur">
        <span className="mr-1 text-white/45">Participant:</span>
        Peer
      </div>

      <div className="absolute bottom-20 right-4 h-28 w-44 overflow-hidden rounded-xl border border-white/20 bg-black/35 shadow-2xl">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111419]">
            <VideoOff className="h-6 w-6 text-white/50" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/45 px-2 py-1 text-[11px] text-white/75">You</div>
      </div>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/55 p-2 backdrop-blur-md">
        <ControlButton
          active={isAudioEnabled}
          onClick={toggleAudio}
          icon={isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          label={isAudioEnabled ? "Mute" : "Unmute"}
        />
        <ControlButton
          active={isVideoEnabled}
          onClick={toggleVideo}
          icon={isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          label={isVideoEnabled ? "Stop video" : "Start video"}
        />
        <button
          onClick={onLeaveRoom}
          title="Leave room"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--danger)] text-white transition hover:opacity-90"
        >
          <PhoneOff className="h-4 w-4" />
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
      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
        active ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white/80 hover:bg-white/20"
      }`}
    >
      {icon}
    </button>
  );
}
