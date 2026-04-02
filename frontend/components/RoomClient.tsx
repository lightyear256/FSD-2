"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Code2, Monitor } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useChat } from "@/hooks/useChat";
import { MediaPanel } from "@/components/MediaPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { CodePanel } from "@/components/CodePanel";
import { useSocket } from "@/app/context/SocketContext";

interface RoomClientProps {
  roomId: string;
  userId: string;
}

// ── Toolbar button ───────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  danger,
  on,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  on?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all active:scale-95",
        danger
          ? "bg-rose-500/90 text-white hover:bg-rose-500"
          : active
          ? "bg-white/15 text-white ring-1 ring-white/25"
          : on
          ? "bg-white/[0.07] text-white/90 hover:bg-white/[0.12]"
          : "bg-white/[0.04] text-white/50 hover:bg-white/[0.09] hover:text-white/80",
      ].join(" ")}
    >
      <span className="flex h-5 w-5 items-center justify-center">{children}</span>
      <span className="text-[10px] font-medium leading-none tracking-wide">{label}</span>
    </button>
  );
}

export default function RoomClient({ roomId, userId }: RoomClientProps) {
  const router = useRouter();
  const { isConnected, socket } = useSocket();

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setScreenStream(stream);
      // Auto-clear when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setScreenStream(null);
      });
    } catch {
      // User cancelled or permission denied — silently ignore
    }
  };

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
  };

  const toggleScreenShare = () => {
    screenStream ? stopScreenShare() : startScreenShare();
  };


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

  const [chatOpen, setChatOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // ── Shared code ──────────────────────────────────────────────────────────
  const [sharedCode, setSharedCode] = useState("");
  const suppressEcho = useRef(false);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitCode = useCallback(
    (code: string) => {
      if (!socket) return;
      if (throttleTimer.current) return;
      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;
        suppressEcho.current = true;
        socket.emit("code:change", { roomId, code });
      }, 80);
    },
    [socket, roomId]
  );

  useEffect(() => {
    if (!socket) return;
    const onCodeChange = ({ code }: { code: string }) => {
      if (suppressEcho.current) { suppressEcho.current = false; return; }
      setSharedCode(code);
    };
    socket.on("code:change", onCodeChange);
    return () => { socket.off("code:change", onCodeChange); };
  }, [socket]);

  useEffect(() => {
    if (!socket || !isJoined) return;
    socket.emit("code:request", { roomId });
    const onSync = ({ code }: { code: string }) => setSharedCode(code);
    socket.on("code:sync", onSync);
    return () => { socket.off("code:sync", onSync); };
  }, [socket, isJoined, roomId]);

  const handleCodeChange = useCallback(
    (code: string) => { setSharedCode(code); emitCode(code); },
    [emitCode]
  );

  useEffect(() => {
    return () => { cleanup?.(); socket?.disconnect(); };
  }, [cleanup, socket]);

  const handleLeaveRoom = () => {
    cleanup?.();
    socket?.disconnect();
    router.push("/dashboard");
  };

  // ── Loading / error states ───────────────────────────────────────────────
  if (isRoomFull) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Room status</p>
          <h1 className="mt-3 text-2xl font-medium text-white">Room is full</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            This room already has two participants. Please ask the interviewer for a new room link.
          </p>
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

  // ── Layout measurements ──────────────────────────────────────────────────
  // When code editor is open, video area shrinks to a compact strip (180px tall)
  // When only chat is open, video fills full height minus toolbar
  // Chat sidebar is always 340px wide when open (right side)

  const TOOLBAR_H = 56; // px — bottom toolbar height
  const TOPBAR_H = 44;  // px — top bar height
  const CHAT_W = 340;   // px — right chat sidebar width
  const CODE_H = 380;   // px — code editor drawer height
  // When code is open, video collapses to a small strip
  const VIDEO_H_MINI = 180; // px

  return (
    <div className="page-shell flex h-screen flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <div
        className="flex flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-4"
        style={{ height: TOPBAR_H }}
      >
        <p className="mono truncate text-xs text-white/40">{roomId}</p>
        <div className="flex items-center gap-1.5 text-xs text-white/45">
          <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* ── Main content area (everything between top bar and toolbar) ── */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">

        {/* ── Left column: video + code editor stacked ── */}
        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out"
        >
          {/* Video area — shrinks when code is open */}
          <div
            className="relative flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              height: codeOpen
                ? VIDEO_H_MINI
                : "100%",
              flex: codeOpen ? "0 0 auto" : "1 1 0%",
            }}
          >
            <MediaPanel
              localStream={localStream}
              remoteStream={remoteStream}
              screenStream={screenStream}  
              isVideoEnabled={isVideoEnabled}
            />
          </div>

          {/* Code editor — slides up from bottom of left column */}
          <div
            className="overflow-hidden border-t border-white/[0.07] transition-all duration-300 ease-in-out"
            style={{
              height: codeOpen ? CODE_H : 0,
              opacity: codeOpen ? 1 : 0,
              flex: codeOpen ? `0 0 ${CODE_H}px` : "0 0 0px",
              pointerEvents: codeOpen ? "auto" : "none",
            }}
          >
            {codeOpen && (
              <CodePanel code={sharedCode} onChange={handleCodeChange} />
            )}
          </div>
        </div>

        {/* ── Right sidebar: Chat (Google Meet style) ── */}
        <div
          className="flex-shrink-0 overflow-hidden border-l border-white/[0.07] transition-all duration-300 ease-in-out"
          style={{
            width: chatOpen ? CHAT_W : 0,
            opacity: chatOpen ? 1 : 0,
            pointerEvents: chatOpen ? "auto" : "none",
          }}
        >
          <div style={{ width: CHAT_W, height: "100%" }}>
            <ChatPanel
              messages={messages}
              sendMessage={sendMessage}
              currentUserId={userId}
            />
          </div>
        </div>
      </div>

      {/* ── Unified toolbar ── */}
      <div
        className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-white/[0.07] bg-black/30 px-4 backdrop-blur-md"
        style={{ height: TOOLBAR_H }}
      >
        <ToolbarBtn
          onClick={toggleAudio}
          on={isAudioEnabled}
          label={isAudioEnabled ? "Mute" : "Unmute"}
        >
          {isAudioEnabled
            ? <Mic className="h-4 w-4" />
            : <MicOff className="h-4 w-4" />}
        </ToolbarBtn>

        <ToolbarBtn
          onClick={toggleVideo}
          on={isVideoEnabled}
          label={isVideoEnabled ? "Cam off" : "Cam on"}
        >
          {isVideoEnabled
            ? <Video className="h-4 w-4" />
            : <VideoOff className="h-4 w-4" />}
        </ToolbarBtn>

        <ToolbarBtn onClick={handleLeaveRoom} danger label="Leave">
          <PhoneOff className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => setChatOpen((v) => !v)}
          active={chatOpen}
          label="Chat"
        >
          <MessageSquare className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={toggleScreenShare}
          active={!!screenStream}
          label={screenStream ? "Stop share" : "Share"}
        >
          <Monitor className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => setCodeOpen((v) => !v)}
          active={codeOpen}
          label="Code"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>
    </div>
  );
}