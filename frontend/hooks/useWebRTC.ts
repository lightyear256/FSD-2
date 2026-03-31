"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";

// ---------------------------------------------------------------------------
// ICE server configuration
// ---------------------------------------------------------------------------
// STUN alone works on the same device / same LAN.
// For two users on DIFFERENT networks you MUST have a TURN relay.
//
// Free options:
//   • Metered.ca  — https://www.metered.ca/tools/openrelay/
//   • Xirsys       — https://xirsys.com  (generous free tier)
//   • Twilio       — https://www.twilio.com/stun-turn  (trial credits)
//   • self-host    — coturn  https://github.com/coturn/coturn
//
// Replace the placeholder values below with your real TURN credentials.
// ---------------------------------------------------------------------------
const ICE_SERVERS: RTCIceServer[] = [
  // Public STUN servers (keep these)
  {
    urls: [
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
  // ---- TURN server (required for cross-network connections) ----
  // Option A: Metered Open Relay (free, no sign-up)
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
  // ---- Replace above with your own TURN server for production ----
  // {
  //   urls: "turn:your-turn-server.com:3478",
  //   username: "your-username",
  //   credential: "your-credential",
  // },
];

export function useWebRTC(roomId: string, userId: string) {
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "idle">("idle");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null); // stable ref for callbacks

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

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
      peerConnection.current.close();
      peerConnection.current = null;
    }
    pendingCandidates.current = [];
    setRemoteStream(null);
    setConnectionState("idle");
  }, []);

  // ------------------------------------------------------------------
  // Create a fresh RTCPeerConnection and wire up all handlers
  // ------------------------------------------------------------------
  const createPeerConnection = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      // Clean up any existing connection first
      closePeerConnection();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("ice-candidate", event.candidate);
        }
      };

      pc.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);
        // event.streams[0] is the most reliable way to get the remote stream
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          // Fallback: build stream from individual tracks
          setRemoteStream((prev) => {
            const s = prev ?? new MediaStream();
            s.addTrack(event.track);
            return s;
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("RTCPeerConnection state:", state);
        setConnectionState(state);

        if (state === "failed") {
          console.warn("Connection failed — attempting ICE restart");
          // Ask the other peer to re-send the offer
          socket?.emit("request-offer");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "disconnected") {
          // Transient disconnection — give it a moment before declaring failed
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              console.warn("ICE still disconnected after timeout");
            }
          }, 5000);
        }
      };

      // Add all local tracks so the remote peer can receive our media
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      peerConnection.current = pc;
      return pc;
    },
    [socket, closePeerConnection]
  );

  // ------------------------------------------------------------------
  // Main effect: acquire media → join room → wire socket events
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    let mounted = true;

    const setup = async () => {
      // 1. Acquire local media
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

      // ------------------------------------------------------------------
      // Socket event handlers
      // ------------------------------------------------------------------

      const handleRoomJoined = ({ isSecondUser }: { roomId: string; userId: string; isSecondUser: boolean }) => {
        console.log("Room joined, isSecondUser:", isSecondUser);
        setIsJoined(true);
        // The second user just waits; the first user will receive "ready" and create an offer.
        // If we ARE the second user, the server already emitted "ready" to the first user.
      };

      const handleRoomFull = () => {
        console.log("Room is full");
        setIsRoomFull(true);
      };

      const handleUserDisconnected = () => {
        console.log("Remote user disconnected");
        closePeerConnection();
      };

      // Server tells the FIRST user "someone joined — send an offer"
      const handleReady = async () => {
        console.log("Received ready — creating offer");
        const pc = createPeerConnection(stream);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", offer);
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };

      // The SECOND user receives the offer → creates an answer
      const handleWebrtcOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        console.log("Received offer — creating answer");
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

      // The FIRST user receives the answer → finalises the connection
      const handleWebrtcAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        console.log("Received answer");
        const pc = peerConnection.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(pc);
        } catch (err) {
          console.error("Error handling answer:", err);
        }
      };

      const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) {
          // Buffer until remote description is set
          pendingCandidates.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      };

      // ------------------------------------------------------------------
      // Register handlers and join the room
      // ------------------------------------------------------------------
      socket.on("room-joined", handleRoomJoined);
      socket.on("room-full", handleRoomFull);
      socket.on("user-disconnected", handleUserDisconnected);
      socket.on("ready", handleReady);
      socket.on("webrtc-offer", handleWebrtcOffer);
      socket.on("webrtc-answer", handleWebrtcAnswer);
      socket.on("ice-candidate", handleIceCandidate);

      // Join the room — server will respond with "room-joined"
      socket.emit("join-room", roomId, userId);
    };

    setup();

    // ------------------------------------------------------------------
    // Cleanup on unmount / dependency change
    // ------------------------------------------------------------------
    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      closePeerConnection();

      socket.off("room-joined");
      socket.off("room-full");
      socket.off("user-disconnected");
      socket.off("ready");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
    };
  }, [roomId, userId, socket, createPeerConnection, closePeerConnection]);

  // ------------------------------------------------------------------
  // Controls
  // ------------------------------------------------------------------

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
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
    socket?.off("room-joined");
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
    connectionState,
    toggleVideo,
    toggleAudio,
    cleanup,
  };
}