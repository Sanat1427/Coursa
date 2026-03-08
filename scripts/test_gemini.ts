import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { client } from "../config/gemini";

async function main() {
    console.log("Testing Gemini...");
    try {
        const notesResp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "What is Gradient Descent in 2 sentences?",
        });
        console.log("Gemini Output:", notesResp.text);
    } catch (e: any) {
        console.error("Gemini Error:", e.message);
    }

    console.log("\nTesting Wikipedia...");
    try {
        const topicStr = encodeURIComponent("Building Your First Basic Graph".replace(/ /g, '_'));
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${topicStr}`);
        console.log("Wiki Status:", wikiRes.status);
        if (wikiRes.ok) {
            const data = await wikiRes.json();
            console.log("Wiki Title:", data.title);
        } else {
            console.log("Wiki failed (expected 404 for specific titles)");
        }
    } catch (e: any) {
        console.error("Wiki Error:", e.message);
    }
}

main();
