import dotenv from "dotenv";
dotenv.config();


import express from "express";
import cors from "cors";
import chatroute from "./route/chat.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", chatroute);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
