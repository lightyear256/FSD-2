import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

const rooms = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    socket.on("join-room", (roomId: string, userId: string) => {
      currentRoom = roomId;
      currentUserId = userId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }

      const room = rooms.get(roomId)!;

      if (room.size >= 2) {
        console.log(`Room ${roomId} is full`);
        socket.emit("room-full");
        return;
      }

      const isSecondUser = room.size === 1;
      room.add(socket.id);
      socket.join(roomId);

      console.log(
        `User ${userId} (${socket.id}) joined room ${roomId} — ${room.size}/2`
      );

      if (isSecondUser) {
        console.log(`Sending ready to first user in room ${roomId}`);
        socket.to(roomId).emit("ready");
      }
    });

    socket.on("webrtc-offer", (offer: RTCSessionDescriptionInit) => {
      if (!currentRoom) return;
      console.log(`Forwarding offer from ${currentUserId} in room ${currentRoom}`);
      socket.to(currentRoom).emit("webrtc-offer", { offer });
    });

    socket.on("webrtc-answer", (answer: RTCSessionDescriptionInit) => {
      if (!currentRoom) return;
      console.log(`Forwarding answer from ${currentUserId} in room ${currentRoom}`);
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

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected from room ${currentRoom}`);

      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            rooms.delete(currentRoom);
          }
        }
        socket.to(currentRoom).emit("user-disconnected", currentUserId);
      }
    });
  });

  return io;
};