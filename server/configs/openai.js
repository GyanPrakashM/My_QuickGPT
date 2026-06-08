import { OpenAI } from "openai";

const geminiApiKey = process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is missing. Create a Gemini API key in Google AI Studio and add it to server/.env.");
}

const openai = new OpenAI({
  apiKey: geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export default openai;
