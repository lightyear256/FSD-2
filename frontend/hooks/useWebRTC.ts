"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";
import Peer, { MediaConnection } from "peerjs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function useWebRTC(roomId: string, userId: string) {
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const peerRef = useRef<Peer | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

 const closeCall = useCallback(() => {
    currentCallRef.current?.close();
    currentCallRef.current = null;
    setRemoteStream(null);
  }, []);
 
  const closePeer = useCallback(() => {
    closeCall();
    peerRef.current?.destroy();
    peerRef.current = null;
  }, [closeCall]);

  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    let mounted = true;

    const setup = async () => {
      let iceServers: RTCIceServer[] = [];
      try {
         const res = await fetch(`${BACKEND_URL}/api/turn`);
        const data = await res.json();
        iceServers = data.iceServers ?? [];
      } catch (err) {
        console.error("Failed to fetch ICE servers, falling back:", err);
        iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.error("Failed to get user media:", err);
        return;
      }

      if (!mounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      
      const peer = new Peer({
        host: new URL(BACKEND_URL).hostname,
        port: Number(new URL(BACKEND_URL).port) || 5000,
        path: "/peerjs",
        secure: BACKEND_URL.startsWith("https"),
        config: { iceServers },
      });
      peerRef.current = peer;

       peer.on("open", (peerId) => {
        if (!mounted) return;
        console.log("PeerJS open, peerId:", peerId);
 
        // Register socket listeners BEFORE emitting join-room
        socket.on("room-full", handleRoomFull);
        socket.on("user-disconnected", handleUserDisconnected);
        socket.on("user-connected", handleUserConnected);
 
        // Pass peerId as the third argument so the backend can share it
        socket.emit("join-room", roomId, userId, peerId);
        setIsJoined(true);
      });
      // Handle receiving calls
     peer.on("call", (call) => {
        console.log("Incoming PeerJS call from:", call.peer);
        currentCallRef.current = call;
        call.answer(stream);
        call.on("stream", (remote) => {
          console.log("Remote stream received (answerer)");
          setRemoteStream(remote);
        });
        call.on("close", () => {
          console.log("Call closed");
          setRemoteStream(null);
        });
        call.on("error", (err) => console.error("Call error:", err));
      });

      peer.on("error", (err) => console.error("PeerJS error:", err));

      const handleRoomFull = () => {
        setIsRoomFull(true);
      };

      const handleUserDisconnected = () => {
        console.log("Remote user disconnected");
        closeCall();
      };

       const handleUserConnected = (remotePeerId: string) => {
        console.log("user-connected — calling peer:", remotePeerId);
        const call = peer.call(remotePeerId, stream);
        currentCallRef.current = call;
        call.on("stream", (remote) => {
          console.log("Remote stream received (caller)");
          setRemoteStream(remote);
        });
        call.on("close", () => {
          console.log("Call closed");
          setRemoteStream(null);
        });
        call.on("error", (err) => console.error("Call error:", err));
      };
    };

    setup();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      closePeer();
      socket.off("room-full");
      socket.off("user-disconnected");
      socket.off("user-connected");
    };
  }, [roomId, userId, socket, closeCall, closePeer]);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  }, []);

  const cleanup = useCallback(() => {
    closePeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsJoined(false);
    socket?.off("room-full");
    socket?.off("user-disconnected");
    socket?.off("user-connected");
  }, [closePeer, socket]);

  return {
    localStream,
    remoteStream,
    isJoined,
    isRoomFull,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    cleanup,
  };
}