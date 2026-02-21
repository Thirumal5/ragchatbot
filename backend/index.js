import dotenv from "dotenv";
dotenv.config();


import express from "express";
import connectDb from "./DB/Db.js";
import cors from "cors";
import chatroute from "./route/chat.js";
import chunkroute from './route/embeding.js'
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", chatroute);
app.use("/api", chunkroute);
app.listen(5000, () => {
  connectDb();
  console.log("Server is running on port 5000");
});
