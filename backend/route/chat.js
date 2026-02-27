import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import { MongoClient } from "mongodb";
import { pipeline } from "@xenova/transformers";

import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";

const route = Router();

const mongo = new MongoClient(process.env.MONGO_URL);
await mongo.connect();

const db = mongo.db("Ragchat");
const collection = db.collection("chunks");

const llm = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1",
  },
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
});

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
});

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
          limit: 3,
        },
      },
    ]).toArray();

    const context = results.map(doc => doc.text).join("\n\n");

    const history = await memory.loadMemoryVariables({});
    const chatHistory = history.chat_history || [];

    const response = await llm.invoke([
      {
        role: "system",
        content: `
You are DocNow AI, a responsible 24/7 medical assistant.

Strict rules:
1. Use ONLY the provided medical context.
2. If insufficient context, say you do not know.
3. Ask duration first.
4. Then ask severity.
5. Then ask related symptoms.
6. No prescriptions or dosages.
7. Recommend doctor if symptoms persist.
8. Keep answers simple.
9. This AI does not replace professional medical consultation.
`
      },
      ...chatHistory,
      {
        role: "user",
        content: `Medical Context:\n${context}\n\nUser Question:\n${message}`
      }
    ]);

    await memory.saveContext(
      { input: message },
      { output: response.content }
    );

    res.json({
      success: true,
      reply: response.content,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: "Medical RAG failed",
    });
  }
});

export default route;