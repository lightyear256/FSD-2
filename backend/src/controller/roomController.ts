import { type Request, type Response } from "express";
import { prisma } from "../lib/prismaClient.js";
import { Prisma } from "../generated/prisma/client.js";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.create({
      data: {}
    });

    return res.json({
      roomId: room.id
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create room" });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { roomId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(400).json({ error: "Room inactive" });
    }

    const existing = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: { userId, roomId }
      }
    });

    if (existing) {
      return res.json({ success: true, participant: existing });
    }

    const count = await prisma.roomParticipant.count({
      where: { roomId }
    });

    if (count >= 2) {
      return res.status(400).json({ error: "Room is full" });
    }

    const participant = await prisma.roomParticipant.create({
      data: { roomId, userId }
    });

    return res.json({ success: true, participant });

  } catch {
    return res.status(500).json({ error: "Failed to join room" });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { roomId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({ error: "Invalid input" });
    }

    await prisma.roomParticipant.deleteMany({
      where: { roomId, userId }
    });

    const remaining = await prisma.roomParticipant.count({
      where: { roomId }
    });

    if (remaining === 0) {
      await prisma.room.update({
        where: { id: roomId },
        data: { isActive: false }
      });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to leave room" });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid room id" });
    }
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
                user: {
                    select: {
                    id: true,
                    name: true,
                    email: true
                    }
                }
            }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    return res.json(room);
  } 
  catch (err) {
    return res.status(500).json({ error: "Failed to fetch room" });
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid room id" });
    }
    const participants = await prisma.roomParticipant.findMany({
      where: { roomId: id },
      include: {
        user: {
        select: {
            id: true,
            name: true,
            email: true
        }
        }
      }
    });

    return res.json(participants);
  } 
  catch (err) {
    return res.status(500).json({ error: "Failed to fetch participants" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid room id" });
    }
    const messages = await prisma.message.findMany({
      where: { roomId: id },
      include: {
        user: {
            select: {
                id: true,
                name: true
            }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json(messages);
  } 
  catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!id || typeof id !== "string" || !userId) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message empty" });
    }

    const message = await prisma.message.create({
      data: {
        roomId: id,
        userId,
        content
      }
    });

    return res.json(message);
  } catch {
    return res.status(500).json({ error: "Failed to send message" });
  }
};