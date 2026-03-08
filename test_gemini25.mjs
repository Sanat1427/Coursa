import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const resp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "test",
        });
        console.log("Success:", !!resp.text);
    } catch (e) {
        console.error("Caught error:", e.message);
    }
}
main();
