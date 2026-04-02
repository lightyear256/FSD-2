"use client";

import { useEffect, useRef, useState } from "react";
import { VideoOff } from "lucide-react";

interface MediaPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
}

export function MediaPanel({ localStream, remoteStream, isVideoEnabled }: MediaPanelProps) {
  const primaryRef = useRef<HTMLVideoElement>(null);
  const pipRef = useRef<HTMLVideoElement>(null);

  const [swapped, setSwapped] = useState(false);

  const primaryStream = swapped ? localStream : remoteStream;
  const pipStream = swapped ? remoteStream : localStream;
  const pipIsMuted = !swapped; // local feed is always muted
  const primaryIsMirrored = swapped; // mirror only when local is primary
  const pipIsMirrored = !swapped;  // mirror only when local is PiP

  useEffect(() => {
    if (primaryRef.current) primaryRef.current.srcObject = primaryStream ?? null;
  }, [primaryStream]);

  useEffect(() => {
    if (pipRef.current) pipRef.current.srcObject = pipStream ?? null;
  }, [pipStream]);

  const primaryHasVideo = swapped ? isVideoEnabled : !!remoteStream;
  const pipHasVideo = swapped ? !!remoteStream : isVideoEnabled;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080a0d]">

      {primaryHasVideo ? (
        <video
          ref={primaryRef}
          autoPlay
          playsInline
          muted={swapped}
          className="h-full w-full object-cover"
          style={primaryIsMirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <>
          
          <video ref={primaryRef} autoPlay playsInline muted className="hidden" />
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <VideoOff className="h-7 w-7 text-white/35" />
            </div>
            <p className="text-xs text-white/35">
              {swapped ? "Your camera is off" : "Waiting for peer…"}
            </p>
          </div>
        </>
      )}

      
      <button
        onClick={() => setSwapped((s) => !s)}
        title="Click to swap"
        className="group absolute bottom-4 right-4 h-[5.5rem] w-36 overflow-hidden rounded-xl border border-white/20 bg-[#0d1014] shadow-2xl transition-transform hover:scale-[1.03] active:scale-[0.97]"
      >
        {pipHasVideo ? (
          <video
            ref={pipRef}
            autoPlay
            playsInline
            muted={pipIsMuted}
            className="h-full w-full object-cover"
            style={pipIsMirrored ? { transform: "scaleX(-1)" } : undefined}
          />
        ) : (
          <>
            <video ref={pipRef} autoPlay playsInline muted className="hidden" />
            <div className="flex h-full items-center justify-center bg-[#0d1014]">
              <VideoOff className="h-5 w-5 text-white/25" />
            </div>
          </>
        )}

        
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[11px] font-medium text-white/80">Swap</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-0.5 text-[10px] text-white/60">
          {swapped ? "Peer" : "You"}
        </div>
      </button>
    </div>
  );
}
