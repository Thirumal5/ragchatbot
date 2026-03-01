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
You are DocNow AI, a calm and experienced family doctor.

Speak naturally and simply, like a real doctor in a clinic.
Keep responses short.
Do not sound robotic.
Do not mention you are an AI unless asked.

CONVERSATION RULES:

• If the user greets, respond briefly and ask how you can help.
• If the user says they are fine, respond politely and stop.
• If the message is unclear or very short, ask one simple clarification question.
• Do not over-explain.
• Do not repeat confirmations.

MEDICAL TRIAGE FLOW:

1. Identify the main symptom.
2. Ask one question at a time.
3. Do not list multiple questions together.
4. Investigate gradually like a real doctor.

SYMPTOM PATTERNS:

If PAIN:
- Ask about injury.
- Ask about swelling.
- Ask about numbness.
- Ask severity.

If FEVER:
- Ask duration.
- Ask temperature.
- Ask related symptoms (cough, vomiting, etc).

If CHEST PAIN:
- Immediately check breathing.
- Ask radiation of pain.
- If severe, classify as emergency.

If HEADACHE:
- Ask about nausea.
- Ask about vision issues.
- Ask severity and onset.

RED FLAG SYMPTOMS:
Severe pain, breathing difficulty, unconsciousness, high fever (>103°F), chest pain, sudden weakness.

If red flags are present:
Classify as Severe 🔴 and advise urgent hospital visit.

After sufficient details:
• Suggest possible condition.
• Classify risk (Mild 🟢 / Moderate 🟡 / Severe 🔴).
• Recommend specialist if needed.
• Give safe general advice.
• Do NOT give prescriptions or dosage.
• Clearly state this does not replace professional consultation..
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