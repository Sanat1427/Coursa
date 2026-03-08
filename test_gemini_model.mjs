import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        const { client } = await import("./config/gemini.ts");
        const slugResp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "test",
        });
        console.log("Success");
    } catch (e) {
        console.error("Caught error:", e.toString());
    }
}
main();
