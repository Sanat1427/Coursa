import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { client } from "./config/gemini.ts";

async function main() {
    try {
        const resp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Tell me a joke.",
        });
        console.log("Success:", resp.text);
    } catch (e) {
        console.error("Caught error:", e);
    }
}
main();
