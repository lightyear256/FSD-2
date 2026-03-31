import { Router } from "express";
import { login, register, googleLogin, setRole, getMe  } from "../controller/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

export const userRouter = Router();

userRouter.post("/login", login);
userRouter.post("/signup", register);
userRouter.post("/google-login", googleLogin);

userRouter.post("/set-role", authMiddleware, setRole);
userRouter.get("/me", authMiddleware, getMe);
