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

    socket.on("join-room", (roomId: string, userId: string) => {
      // Enforce max 2 participants
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      if (numClients >= 2) {
        socket.emit("room-full", roomId);
        return;
      }

      socket.join(roomId);
      console.log(`User ${userId} (socket ${socket.id}) joined room ${roomId}`);
      
      // Notify other user in the room
      socket.to(roomId).emit("user-joined", userId);

      // Handle basic chat messages
      socket.on("chat-message", (message: string) => {
        socket.to(roomId).emit("chat-message", { userId, message });
      });

      // WebRTC Signaling
      socket.on("webrtc-offer", (offer: any) => {
        socket.to(roomId).emit("webrtc-offer", { userId, offer });
      });

      socket.on("webrtc-answer", (answer: any) => {
        socket.to(roomId).emit("webrtc-answer", { userId, answer });
      });

      socket.on("ice-candidate", (candidate: any) => {
        socket.to(roomId).emit("ice-candidate", { userId, candidate });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });
  });

  return io;
};
