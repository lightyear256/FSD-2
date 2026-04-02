"use client";

import { useEffect, useRef, useState } from "react";
import { VideoOff, Monitor } from "lucide-react";

interface MediaPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isVideoEnabled: boolean;
}

// 0 = remote primary / local pip
// 1 = local primary  / remote pip
// 2 = screen primary / local pip (remote hidden)
type SwapState = 0 | 1 | 2;

export function MediaPanel({
  localStream,
  remoteStream,
  screenStream,
  isVideoEnabled,
}: MediaPanelProps) {
  const primaryRef = useRef<HTMLVideoElement>(null);
  const pipRef     = useRef<HTMLVideoElement>(null);

  const [swap, setSwap] = useState<SwapState>(0);

  // Cycle: remote→local→screen(if active)→remote
  const handleSwap = () => {
    setSwap((s) => {
      if (s === 0) return 1;
      if (s === 1) return screenStream ? 2 : 0;
      return 0;
    });
  };

  // If screen share stops externally, fall back
  useEffect(() => {
    if (!screenStream && swap === 2) setSwap(0);
  }, [screenStream, swap]);

  const primaryStream =
    swap === 2 ? screenStream : swap === 1 ? localStream : remoteStream;
  const pipStream = swap === 1 ? remoteStream : localStream;

  const primaryMuted  = swap === 1;          // local is primary → mute
  const pipMuted      = swap !== 1;          // local is pip → mute
  const primaryMirror = swap === 1;          // mirror only when local is primary
  const pipMirror     = swap !== 1;          // mirror only when local is pip

  const primaryHasVideo =
    swap === 2 ? !!screenStream :
    swap === 1 ? isVideoEnabled :
    !!remoteStream;
  const pipHasVideo = swap === 1 ? !!remoteStream : isVideoEnabled;

  const primaryLabel =
    swap === 2 ? "Screen" : swap === 1 ? "You" : "Peer";
  const pipLabel     = swap === 1 ? "Peer" : "You";

  useEffect(() => {
    if (primaryRef.current) primaryRef.current.srcObject = primaryStream ?? null;
  }, [primaryStream]);

  useEffect(() => {
    if (pipRef.current) pipRef.current.srcObject = pipStream ?? null;
  }, [pipStream]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080a0d]">

      {/* ── Primary ── */}
      {primaryHasVideo ? (
        <video
          ref={primaryRef}
          autoPlay
          playsInline
          muted={primaryMuted}
          className="h-full w-full object-cover"
          style={primaryMirror ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <>
          <video ref={primaryRef} autoPlay playsInline muted className="hidden" />
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <VideoOff className="h-7 w-7 text-white/35" />
            </div>
            <p className="text-xs text-white/35">
              {swap === 0 ? "Waiting for peer…" : "Your camera is off"}
            </p>
          </div>
        </>
      )}

      {/* ── Screen share badge ── */}
      {swap === 2 && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm">
          <Monitor className="h-3 w-3" />
          Screen share
        </div>
      )}

      {/* ── PiP ── */}
      <button
        onClick={handleSwap}
        title="Click to swap view"
        className="group absolute bottom-4 right-4 h-[5.5rem] w-36 overflow-hidden rounded-xl border border-white/20 bg-[#0d1014] shadow-2xl transition-transform hover:scale-[1.03] active:scale-[0.97]"
      >
        {pipHasVideo ? (
          <video
            ref={pipRef}
            autoPlay
            playsInline
            muted={pipMuted}
            className="h-full w-full object-cover"
            style={pipMirror ? { transform: "scaleX(-1)" } : undefined}
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
          {pipLabel}
        </div>
      </button>
    </div>
  );
}