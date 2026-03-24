import express from 'express'
import {type Request, type Response} from 'express'
export const app=express();
app.use(express.json());

app.get("/",(req:Request,res:Response)=>{
    res.json("server running")
})