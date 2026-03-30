import { Router } from "express";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getParticipants,
  getMessages,
  sendMessage,
} from "../controller/roomController.js";
import authMiddleware from "../middleware/authMiddleware.js"

export const roomRouter = Router();

roomRouter.use(authMiddleware);

roomRouter.post("/create", createRoom);
roomRouter.post("/join", joinRoom);
roomRouter.post("/leave", leaveRoom);

roomRouter.get("/:id", getRoom);
roomRouter.get("/:id/participants", getParticipants);

roomRouter.get("/:id/messages", getMessages);
roomRouter.post("/:id/message", sendMessage);