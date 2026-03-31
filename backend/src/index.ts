import express from 'express'
import {type Request, type Response} from 'express'
import { userRouter } from './routes/userRouter.js';
import { roomRouter } from './routes/roomRouter.js';
import cors from "cors"

export const app=express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

app.get("/",(req:Request,res:Response)=>{
    res.json("server running")
})
app.use("/user",userRouter);
app.use("/room", roomRouter);
