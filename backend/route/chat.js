import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import { OpenAI } from "openai"
const route = Router();

const client = new OpenAI(
    {
        apiKey:process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
    }
)


route.post('/chat', async (req, res) => {

    const { message } = req.body;

    try {
        const response = await client.chat.completions.create(
            {
                model: "llama-3.3-70b-versatile",

                messages: [
                    {
                        role: "user",
                        content: `${message}`

                    }
                ]


            }
        )
        return res.json({success:true, reply: response.choices[0].message.content });
    }
    catch (err) {
        return res.json({success:false,err: "error in Ai response" });
    }



})
export default route;