import { Router } from "express";
import fs from "fs";

const route = Router();

route.get("/chunk", (req, res) => {
  try {
    const text = fs.readFileSync("./data/health.txt", "utf-8");

    const chunks = text
      .split(/\r?\n\r?\n/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0);

    res.json({
      totalChunks: chunks.length,
      chunks
    });

  } catch (err) {
    res.status(500).json({ error: "Chunking failed" });
  }
});

export default route;
