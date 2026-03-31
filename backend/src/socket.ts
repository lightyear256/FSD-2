import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("New client connected:", socket.id);

    let currentRoom: string | null = null;
    let currentUserId: string | null = null;

    socket.on("join-room", (roomId: string, userId: string) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? (room.has(socket.id) ? room.size - 1 : room.size) : 0;

      if (numClients >= 2) {
        socket.emit("room-full", roomId);
        return;
      }

      if (currentRoom && currentRoom !== roomId) {
        socket.leave(currentRoom);
      }

      socket.join(roomId);
      currentRoom = roomId;
      currentUserId = userId;
      console.log(`User ${userId} (socket ${socket.id}) joined room ${roomId}`);
      
      socket.to(roomId).emit("user-joined", userId);
    });

    socket.on("chat-message", (message: string) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("chat-message", { userId: currentUserId, message });
      }
    });

    socket.on("webrtc-offer", (offer: any) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("webrtc-offer", { userId: currentUserId, offer });
      }
    });

    socket.on("webrtc-answer", (answer: any) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("webrtc-answer", { userId: currentUserId, answer });
      }
    });

    socket.on("ice-candidate", (candidate: any) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("ice-candidate", { userId: currentUserId, candidate });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${currentUserId} disconnected from room ${currentRoom}`);
      if (currentRoom) {
        socket.to(currentRoom).emit("user-disconnected", currentUserId);
      }
    });
  });

  return io;
};
