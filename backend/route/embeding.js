import { Router } from "express";
import fs from "fs";
import { pipeline } from "@xenova/transformers";

const route = Router();

route.get("/embedding", async (req, res) => {
  try {
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    const text = fs.readFileSync("./data/health.txt", "utf-8");

    const chunks = text
      .split(/\r?\n\r?\n/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0);

    const embeddings=[]

    for(let chunk of chunks)
    {
      const output=await extractor(chunk,{
        pooling:"mean",
        normalize:true
      })

      embeddings.push(
       {
        text: chunk,
        embeddings:Array.from(output.data)
       }
      )
    }

    res.json({
      totalChunks: chunks.length,
      embeddings,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Embedding failed" });
  }
});

export default route;
