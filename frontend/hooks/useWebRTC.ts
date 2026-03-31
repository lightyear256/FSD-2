"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";

export function useWebRTC(roomId: string, userId: string) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize WEBRTC components and local media
  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    // Get User Media
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Notify backend we want to join
        socket.emit("join-room", roomId, userId);
      } catch (err) {
        console.error("Failed to get local media", err);
      }
    };

    getMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, socket]);

  // Setup Peer Connection Helper
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  }, [localStream, socket]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !localStream) return;

    socket.on("room-full", () => {
      setIsRoomFull(true);
    });

    socket.on("user-joined", async (newUserId: string) => {
      console.log("User joined:", newUserId);
      setIsJoined(true);
      
      const pc = createPeerConnection();
      peerConnection.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("webrtc-offer", offer);
    });

    socket.on("user-disconnected", () => {
      console.log("Remote user disconnected");
      setRemoteStream(null);
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    });

    socket.on("webrtc-offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      console.log("Received Offer");
      setIsJoined(true);
      const pc = createPeerConnection();
      peerConnection.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit("webrtc-answer", answer);
    });

    socket.on("webrtc-answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("Received Answer");
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding received ice candidate", err);
      }
    });

    return () => {
      socket.off("room-full");
      socket.off("user-joined");
      socket.off("user-disconnected");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
    };
  }, [socket, localStream, createPeerConnection]);

  // Media Control Toggles
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isJoined,
    isRoomFull,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio
  };
}
