import { Router } from "express";
import { addUser, confirmCode, resendVerificationCode, getPendingUsers, logIn } from "./user.controller.js";
import { authLimiter, verificationLimiter } from "../../middleware/rateLimiter.js";

export const userRouter = Router();

userRouter
    .post('/signup', authLimiter, addUser)
    .post('/verify-signup', verificationLimiter, confirmCode)
    .post('/resend-code', resendVerificationCode)
    .post('/signin', authLimiter, logIn)
    .get('/pending-users', getPendingUsers)
    .get('/users',(req,res)=>{
        res.json({message:"hi",data:'Habibyyyyyyyyy'})
    })