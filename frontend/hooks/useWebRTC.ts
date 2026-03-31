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

  // Setup Peer Connection Helper
  const createPeerConnection = useCallback((stream: MediaStream) => {
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

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    return pc;
  }, [socket]);

  // Main Effect for initializing media and socket listeners robustly
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
            // Already unmounted while fetching media
            currentStream.getTracks().forEach(t => t.stop());
            return;
        }

        setLocalStream(currentStream);

        // Bind essential socket event handlers *before* joining the room!
        const handleRoomFull = () => setIsRoomFull(true);

        const handleUserJoined = async (newUserId: string) => {
          console.log("User joined:", newUserId);
          setIsJoined(true);
          
          // Cleanup old PC
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

        const handleUserDisconnected = () => {
          console.log("Remote user disconnected");
          setRemoteStream(null);
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }
          pendingCandidates.current = [];
        };

        const handleWebrtcOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
          console.log("Received Offer");
          setIsJoined(true);

          if (peerConnection.current) {
            peerConnection.current.close();
          }

          const pc = createPeerConnection(currentStream as MediaStream);
          peerConnection.current = pc;

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process any queued candidates if they arrived early
            for (const candidate of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit("webrtc-answer", answer);
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        };

        const handleWebrtcAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
          console.log("Received Answer");
          if (!peerConnection.current) return;

          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

            // Process any queued candidates if they arrived early
            for (const candidate of pendingCandidates.current) {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];
          } catch (err) {
            console.error("Error handling answer:", err);
          }
        };

        const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
          if (!peerConnection.current || !peerConnection.current.remoteDescription) {
            pendingCandidates.current.push(candidate);
            return;
          }
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding received ice candidate:", err);
          }
        };

        socket.on("room-full", handleRoomFull);
        socket.on("user-joined", handleUserJoined);
        socket.on("user-disconnected", handleUserDisconnected);
        socket.on("webrtc-offer", handleWebrtcOffer);
        socket.on("webrtc-answer", handleWebrtcAnswer);
        socket.on("ice-candidate", handleIceCandidate);

        // Finally, notify backend we want to join *after* listeners are active
        socket.emit("join-room", roomId, userId);

      } catch (err) {
        console.error("Failed to get local media", err);
      }
    };

    setupMediaAndSocket();

    return () => {
      isComponentMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      
      // We pass the name of the event and remove any listeners attached. We don't remove 
      // other components' handlers, just clear out everything mapped via this hook, which is fine!
      socket.off("room-full");
      socket.off("user-joined");
      socket.off("user-disconnected");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
    };
  }, [roomId, userId, socket, createPeerConnection]);

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
