const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");

const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
    try {
        console.log("Initializing GoogleGenAI...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        console.log("Calling gemini-2.5-flash...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, respond with a short message.',
        });
        
        console.log("Response text:", response.text);
    } catch (err) {
        console.error("Gemini failed:", err);
    }
}

testGemini();
