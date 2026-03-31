import { type Request, type Response } from "express";
import { prisma } from "../lib/prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client.js";
type userData = {
  name?: string;
  email: string;
  password: string;
  role: ROLE
};

enum ROLE{
  "CANDIDATE",
  "INTERVIEWER"
}

export async function login(req: Request, res: Response) {
  try {
    const userData = req.body as Partial<userData>;
    if (
      typeof userData.email !== "string" ||
      typeof userData.password !== "string" ||
      userData.email.trim().length === 0 ||
      userData.password.trim().length === 0
    ) {
      return res.status(404).send({
        msg: "No data Came",
        success: false,
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        email: userData.email.trim(),
      },
    });
    if (!user) {
      return res.status(404).send({
        msg: "User not exist",
        success: false,
      });
    }
    const success = await bcrypt.compare(userData.password, user.password!);
    if (!success) {
      return res.status(403).send({
        msg: "Password incorrect",
        success: false,
      });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "ddd",
      { expiresIn: "70000s" },
    );
    res.status(200).send({
      msg: "logged in successfully",
      success: true,
      token: token,
    });
  } catch (error) {
    res.status(500).send({
      msg: "Internal Server Error" + error,
    });
  }
}
export async function register(req: Request, res: Response) {
  try {
    const userData = req.body as Partial<userData>;
    if (
      typeof userData.name !== "string" ||
      typeof userData.email !== "string" ||
      typeof userData.password !== "string" ||
      typeof userData.role !== "string" ||
      userData.name.trim().length === 0 ||
      userData.email.trim().length === 0 ||
      userData.password.trim().length === 0
    ) {
      return res.status(400).send({
        msg: "name, email and password are required",
        success: false,
      });
    }

    const email = userData.email.trim();
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).send({
        msg: "User already exists",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: userData.name.trim(),
        email,
        password: hashedPassword,
        role: userData.role
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || "ddd",
      { expiresIn: "70000s" },
    );

    return res.status(201).send({
      msg: "User registered successfully",
      success: true,
      token,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).send({
        msg: "Invalid user query request",
        success: false,
      });
    }

    return res.status(500).send({
      msg: "Internal Server Error" + error,
    });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).send({
        msg: "Email is required",
        success: false,
      });
    }

    let user = await prisma.user.findFirst({
      where: { email: email.trim() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.trim(),
          name: name ? name.trim() : "Google User",
          password: "",
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "ddd",
      { expiresIn: "70000s" },
    );

    return res.status(200).send({
      msg: "Google login successful",
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return res.status(500).send({
      msg: "Internal Server Error " + error,
      success: false,
    });
  }
}

export async function setRole(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    if (!role || !["CANDIDATE", "INTERVIEWER"].includes(role)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid role",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return res.status(200).json({
      success: true,
      msg: "Role updated successfully",
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Failed to set role",
    });
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return res.json(user);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};