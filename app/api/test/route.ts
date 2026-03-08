import { NextResponse } from "next/server";
import { client } from "@/config/gemini";

export const dynamic = 'force-dynamic';

export async function GET() {
    let result: any = {};

    // 1. Test Gemini
    try {
        const notesResp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "What is Gradient Descent in 2 sentences?",
        });
        result.gemini = notesResp.text?.trim() || "No text available";
    } catch (e: any) {
        result.geminiError = e?.message || e?.toString();
    }

    // 2. Test Wikipedia
    try {
        const topicStr = encodeURIComponent("Real-World Applications".replace(/ /g, '_'));
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${topicStr}`);
        if (!wikiRes.ok) {
            result.wikiError = `Status ${wikiRes.status}: ${wikiRes.statusText}`;
        } else {
            const wikiData = await wikiRes.json();
            result.wiki = { title: wikiData.title, extract: wikiData.extract };
        }
    } catch (e: any) {
        result.wikiError = e?.message || e?.toString();
    }

    return NextResponse.json(result);
}
