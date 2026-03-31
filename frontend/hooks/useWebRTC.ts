"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";

const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function useWebRTC(roomId: string, userId: string) {
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  const flushPendingCandidates = async (pc: RTCPeerConnection) => {
    for (const candidate of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding buffered ICE candidate:", e);
      }
    }
    pendingCandidates.current = [];
  };

  const closePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.onicecandidate = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }
    pendingCandidates.current = [];
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      closePeerConnection();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("ice-candidate", event.candidate);
        }
      };

      pc.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);
        if (event.streams?.[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          setRemoteStream((prev) => {
            const s = prev ?? new MediaStream();
            s.addTrack(event.track);
            return s;
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "failed") {
          console.warn("Connection failed — requesting re-negotiation");
          socket?.emit("request-offer");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      peerConnection.current = pc;
      return pc;
    },
    [socket, closePeerConnection]
  );

  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    let mounted = true;

    const setup = async () => {
      // Step 1: acquire media first
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

      // Step 2: define handlers (close over `stream`)

      const handleRoomFull = () => {
        setIsRoomFull(true);
      };

      const handleUserDisconnected = () => {
        console.log("Remote user disconnected");
        closePeerConnection();
      };

      const handleReady = async () => {
        console.log("'ready' — creating offer");
        const pc = createPeerConnection(stream);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", offer);
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };

      const handleWebrtcOffer = async ({
        offer,
      }: {
        offer: RTCSessionDescriptionInit;
      }) => {
        console.log("Offer received — answering");
        const pc = createPeerConnection(stream);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-answer", answer);
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      };

      const handleWebrtcAnswer = async ({
        answer,
      }: {
        answer: RTCSessionDescriptionInit;
      }) => {
        console.log("Answer received");
        const pc = peerConnection.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(pc);
        } catch (err) {
          console.error("Error handling answer:", err);
        }
      };

      const handleIceCandidate = async ({
        candidate,
      }: {
        candidate: RTCIceCandidateInit;
      }) => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) {
          pendingCandidates.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      };

      // Step 3: register ALL listeners BEFORE emitting join-room
      // Critical: prevents race where server responds before listeners attach
      socket.on("room-full", handleRoomFull);
      socket.on("user-disconnected", handleUserDisconnected);
      socket.on("ready", handleReady);
      socket.on("webrtc-offer", handleWebrtcOffer);
      socket.on("webrtc-answer", handleWebrtcAnswer);
      socket.on("ice-candidate", handleIceCandidate);

      // Step 4: join — server emits "ready" to the other peer after this
      socket.emit("join-room", roomId, userId);

      // Step 5: mark joined — no need to wait for server ack
      setIsJoined(true);
    };

    setup();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      closePeerConnection();
      socket.off("room-full");
      socket.off("user-disconnected");
      socket.off("ready");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
    };
  }, [roomId, userId, socket, createPeerConnection, closePeerConnection]);

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
    closePeerConnection();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsJoined(false);
    socket?.off("room-full");
    socket?.off("user-disconnected");
    socket?.off("ready");
    socket?.off("webrtc-offer");
    socket?.off("webrtc-answer");
    socket?.off("ice-candidate");
  }, [closePeerConnection, socket]);

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