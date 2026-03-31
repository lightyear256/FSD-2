"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../app/context/SocketContext";

export function useWebRTC(roomId: string, userId: string) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("ice-candidate", event.candidate);
        }
      };

      pc.ontrack = (event) => {
        console.log("Remote track received");
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      return pc;
    },
    [socket]
  );

  const addPendingCandidates = async (pc: RTCPeerConnection) => {
    for (const candidate of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding buffered candidate:", e);
      }
    }
    pendingCandidates.current = [];
  };

  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    let currentStream: MediaStream | null = null;
    let isComponentMounted = true;

    const setupMediaAndSocket = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isComponentMounted) {
          currentStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(currentStream);


        const handleRoomFull = () => {
          console.log("Room is full");
          setIsRoomFull(true);
        };

        const handleUserDisconnected = () => {
          console.log("Remote user disconnected");
          setRemoteStream(null);
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }
          pendingCandidates.current = [];
        };

        const handleReady = async () => {
          console.log("Received ready — creating offer");
          if (peerConnection.current) {
            peerConnection.current.close();
          }

          const pc = createPeerConnection(currentStream as MediaStream);
          peerConnection.current = pc;

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
          console.log("Received offer — creating answer");

          if (peerConnection.current) {
            peerConnection.current.close();
          }

          const pc = createPeerConnection(currentStream as MediaStream);
          peerConnection.current = pc;

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await addPendingCandidates(pc);

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
          console.log("Received answer");
          if (!peerConnection.current) return;

          try {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            await addPendingCandidates(peerConnection.current);
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

        socket.on("room-full", handleRoomFull);
        socket.on("user-disconnected", handleUserDisconnected);
        socket.on("ready", handleReady);
        socket.on("webrtc-offer", handleWebrtcOffer);
        socket.on("webrtc-answer", handleWebrtcAnswer);
        socket.on("ice-candidate", handleIceCandidate);

        socket.emit("join-room", roomId, userId);
        setIsJoined(true);
      } catch (err) {
        console.error("Failed to get local media:", err);
      }
    };

    setupMediaAndSocket();

    return () => {
      isComponentMounted = false;
      currentStream?.getTracks().forEach((track) => track.stop());
      peerConnection.current?.close();

      socket.off("room-full");
      socket.off("user-disconnected");
      socket.off("ready");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
    };
  }, [roomId, userId, socket, createPeerConnection]);

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const cleanup = useCallback(() => {
    peerConnection.current?.close();
    peerConnection.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    pendingCandidates.current = [];
    socket?.off("room-full");
    socket?.off("user-disconnected");
    socket?.off("ready");
    socket?.off("webrtc-offer");
    socket?.off("webrtc-answer");
    socket?.off("ice-candidate");
  }, [localStream, socket]);

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