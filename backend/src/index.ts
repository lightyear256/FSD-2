import express from 'express'
import {type Request, type Response} from 'express'
import { userRouter } from './routes/userRouter.js';
import { roomRouter } from './routes/roomRouter.js';
export const app=express();
app.use(express.json());

app.get("/",(req:Request,res:Response)=>{
    res.json("server running")
})
app.use("/user",userRouter);
app.use("/room", roomRouter);
