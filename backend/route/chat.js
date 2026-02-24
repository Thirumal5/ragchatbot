import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import { OpenAI } from "openai";
import { pipeline } from "@xenova/transformers";
import { MongoClient } from "mongodb";

const route = Router();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});


const mongo = new MongoClient(process.env.MONGO_URL);
await mongo.connect();
const db = mongo.db("Ragchat");
const collection = db.collection("chunks");


let extractor;
async function getEmbedding(text) {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

route.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    
    const queryEmbedding = await getEmbedding(message);

    
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 2,
        },
      },
    ]).toArray();


    const context = results.map(doc => doc.text).join("\n\n");

   
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a healthcare assistant. Use only the provided context to answer. If unsure, advise consulting a doctor.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${message}`,
        },
      ],
    });

    res.json({
      success: true,
      reply: response.choices[0].message.content,
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      err: "RAG chat failed",
    });
  }
});

export default route;