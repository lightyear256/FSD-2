import { Router } from "express";
import { login, register } from "../controller/userController.js";

export const userRouter=Router();

userRouter.post('/login',login);
userRouter.post('/signup',register);