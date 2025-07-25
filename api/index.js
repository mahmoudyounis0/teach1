import express from "express";
import dotenv from "dotenv";
import { connectToDB } from "../database/db.connection.js"
import { userRouter } from "../modules/user/user.route.js";
import { verifyToken } from "../middleware/jwtAuth.js";
import { createIndexes } from "../database/dbIndexes.js";
import cors from "cors"
dotenv.config();
const app = express();
app.use(cors())
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Dars-Track API", status: "online" })
})
app.get("/hello", (req, res) => {
  res.json({ message: "Welcome to the Dars-Track API", status: "online" })
})
app.use('/auth/', userRouter);

// app.use(verifyToken)

const port = process.env.PORT || 3000;
app.use((err, req, res) => {
  console.error("Global error handler:", err.stack)
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  })
})
await connectToDB();
await createIndexes();
// const startServer = async () => {
//   try {
//     await connectToDB();
//     await createIndexes();
//     app.listen(port, () => {
//       console.log("server is running on port " + port);

//     })
//   } catch (err) {
//     console.log(err);

//   }
// }
// startServer();
export default app;
