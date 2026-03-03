import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import { MongoClient } from "mongodb";
import { pipeline } from "@xenova/transformers";
import { ChatOpenAI } from "@langchain/openai";

const route = Router();

const mongo = new MongoClient(process.env.MONGO_URL);
await mongo.connect();
const db = mongo.db("Ragchat");
const collection = db.collection("chunks");

const llm = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
});

let extractor;

async function getEmbedding(text) {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

route.post("/chat", async (req, res) => {
  const { message, chatHistory = [] } = req.body;

  try {
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message required",
      });
    }

    const queryEmbedding = await getEmbedding(message);

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "default",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 3,
          },
        },
      ])
      .toArray();

    const context = results.length
      ? results.map((doc) => doc.text.slice(0, 800)).join("\n\n")
      : "No strong medical context found.";

    

    const systemPrompt = `
You are DocNow AI, a calm and experienced family doctor.

Strict Rules:
- Reply in same language as user.
- Ask only one question at a time.
- Always classify severity clearly as:
  Mild 🟢
  Moderate 🟡
  Severe 🔴
- If Severe 🔴:
    1. Recommend immediate hospital visit.
    2. Ask user for their location.
- Never give prescription dosage.
- Keep response concise and calm.
`

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "system", content: `Relevant Medical Context:\n${context}` },
      ...chatHistory,
      { role: "user", content: message },
    ]);

    res.json({
      success: true,
      reply: response.content,
    });

  } catch (err) {
    console.error("RAG Error:", err);
    res.status(500).json({
      success: false,
      error: "Medical RAG failed",
    });
  }
});

export default route;