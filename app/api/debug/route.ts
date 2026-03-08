import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

    const results: any = { keys: { apiKey: !!SEARCH_API_KEY, engineId: !!SEARCH_ENGINE_ID } };

    if (!SEARCH_API_KEY || !SEARCH_ENGINE_ID) {
        return NextResponse.json({ error: "keys not set", results });
    }

    for (const site of ["geeksforgeeks.org", "w3schools.com"]) {
        const query = encodeURIComponent(`site:${site} Java variables`);
        const url = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&num=1`;
        try {
            const res = await fetch(url);
            const text = await res.text();
            if (!res.ok) {
                results[site] = { error: `${res.status}: ${text.slice(0, 300)}` };
            } else {
                const data = JSON.parse(text);
                results[site] = {
                    topItem: data.items?.[0] ? { title: data.items[0].title, url: data.items[0].link } : "NO_ITEMS",
                    totalResults: data.searchInformation?.totalResults,
                };
            }
        } catch (e: any) {
            results[site] = { error: e?.message };
        }
    }

    return NextResponse.json(results);
}
