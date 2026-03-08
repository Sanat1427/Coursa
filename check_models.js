const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModels() {
    try {
        const response = await ai.models.list();
        for await (const model of response) {
            if (model.name.includes('gemini-2.0') || model.name.includes('gemini-1.5')) {
                console.log(model.name);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
checkModels();
