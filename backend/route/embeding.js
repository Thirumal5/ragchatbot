import { Router } from "express";
import fs from "fs/promises";
import Chunk from "../model/chunk.js";
import { pipeline } from "@xenova/transformers";

const route = Router();

let extractor;

(async () => {
  extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
})();

route.get("/embedding", async (req, res) => {
  try {
    const files = ["./data/health.txt", "./data/drug.txt"];
    let allChunks = [];

    for (let file of files) {
      const text = await fs.readFile(file, "utf-8");

      const chunks = text
        .split(/\r?\n\r?\n/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0);

      const chunksWithSource = chunks.map((chunk) => ({
        text: chunk,
        source: file,
      }));

      allChunks.push(...chunksWithSource);
    }

    const embeddings = await Promise.all(
      allChunks.map(async (item) => {
        const output = await extractor(item.text, {
          pooling: "mean",
          normalize: true,
        });

        return {
          text: item.text,
          source: item.source,
          embedding: Array.from(output.data),
        };
      })
    );

    await Chunk.insertMany(embeddings);

    res.json({
      success: true,
      totalChunks: embeddings.length,
      msg: "All embeddings saved to DB",
    });
  } catch (err) {
    res.status(500).json({ error: "Embedding failed" });
  }
});

export default route;