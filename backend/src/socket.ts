import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "./lib/prismaClient.js";

const rooms = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    socket.on("join-room", async(roomId: string, userId: string, peerId?: string) => {
      // Handle reconnects: leave previous room first
      if (currentRoom) {
        const prev = rooms.get(currentRoom);
        if (prev) {
          prev.delete(socket.id);
          if (prev.size === 0) rooms.delete(currentRoom);
        }
        socket.leave(currentRoom);
      }

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

      try {
        const existing = await prisma.roomParticipant.findUnique({
          where: { userId_roomId: { userId, roomId } }
        });

        if (!existing) {
          await prisma.roomParticipant.create({
            data: { roomId, userId }
          });
        }
      } catch (err) {
        console.error("Failed to save participant to DB:", err);
      }
      console.log(`User ${userId} (${socket.id}) joined room ${roomId} — ${room.size}/2`);

      if (peerId) {
        // Notify others in room to call this peer
        socket.to(roomId).emit("user-connected", peerId);
      }
    });



    socket.on("chat-message", async(message: string) => {
      if (!currentRoom || !currentUserId) return;

      try {
        await prisma.message.create({
          data: {
            roomId: currentRoom,
            userId: currentUserId,
            content: message,
          }
        });
      } catch (err) {
        console.error("Failed to save message to DB:", err);
      }
      socket.to(currentRoom).emit("chat-message", {
        userId: currentUserId,
        message,
      });
    });

    socket.on("disconnect", async() => {
      console.log(`Socket ${socket.id} disconnected from room ${currentRoom}`);
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) rooms.delete(currentRoom);
        }
        socket.to(currentRoom).emit("user-disconnected", currentUserId);
        socket.leave(currentRoom);
      }

       if (currentRoom && currentUserId) {
        try {
          await prisma.roomParticipant.deleteMany({
            where: { roomId: currentRoom, userId: currentUserId }
          });
        } catch (err) {
          console.error("Failed to remove participant from DB:", err);
        }
      }
    });
  });

  return io;
};