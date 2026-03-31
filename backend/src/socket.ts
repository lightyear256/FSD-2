import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

interface RoomState {
  sockets: Set<string>;     // socket.id values
  userIds: Map<string, string>; // socket.id -> userId
}

const rooms = new Map<string, RoomState>();

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    // Increase ping timeout for cross-device connections on slower networks
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    socket.on("join-room", (roomId: string, userId: string) => {
      // If already in a room, leave it first (handles reconnects)
      if (currentRoom) {
        leaveCurrentRoom();
      }

      currentRoom = roomId;
      currentUserId = userId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { sockets: new Set(), userIds: new Map() });
      }

      const room = rooms.get(roomId)!;

      if (room.sockets.size >= 2) {
        console.log(`Room ${roomId} is full`);
        socket.emit("room-full");
        return;
      }

      const isSecondUser = room.sockets.size === 1;

      room.sockets.add(socket.id);
      room.userIds.set(socket.id, userId);
      socket.join(roomId);

      console.log(
        `User ${userId} (${socket.id}) joined room ${roomId} — ${room.sockets.size}/2`
      );

      // Emit join acknowledgement so client knows they're in the room
      socket.emit("room-joined", { roomId, userId, isSecondUser });

      if (isSecondUser) {
        // Tell the FIRST user to create and send an offer
        console.log(`Sending ready to first user in room ${roomId}`);
        socket.to(roomId).emit("ready");
      }
    });

    socket.on("webrtc-offer", (offer: RTCSessionDescriptionInit) => {
      if (!currentRoom) return;
      console.log(
        `Forwarding offer from ${currentUserId} in room ${currentRoom}`
      );
      socket.to(currentRoom).emit("webrtc-offer", { offer });
    });

    socket.on("webrtc-answer", (answer: RTCSessionDescriptionInit) => {
      if (!currentRoom) return;
      console.log(
        `Forwarding answer from ${currentUserId} in room ${currentRoom}`
      );
      socket.to(currentRoom).emit("webrtc-answer", { answer });
    });

    socket.on("ice-candidate", (candidate: RTCIceCandidateInit) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit("ice-candidate", { candidate });
    });

    socket.on("chat-message", (message: string) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit("chat-message", {
        userId: currentUserId,
        message,
      });
    });

    // Allow client to explicitly request a re-negotiation
    socket.on("request-offer", () => {
      if (!currentRoom) return;
      console.log(`Re-negotiation requested by ${currentUserId}`);
      socket.to(currentRoom).emit("ready");
    });

    const leaveCurrentRoom = () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room) {
        room.sockets.delete(socket.id);
        room.userIds.delete(socket.id);
        if (room.sockets.size === 0) {
          rooms.delete(currentRoom);
        }
      }
      socket.to(currentRoom).emit("user-disconnected", currentUserId);
      socket.leave(currentRoom);
    };

    socket.on("leave-room", () => {
      leaveCurrentRoom();
      currentRoom = null;
      currentUserId = null;
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket ${socket.id} disconnected from room ${currentRoom}`
      );
      leaveCurrentRoom();
    });
  });

  return io;
};