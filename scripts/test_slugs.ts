import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const chapters = [
    "Introduction to Java and Environment Setup",
    "JavaScript Promises",
    "Gradient Descent",
    "CSS Flexbox Layout",
];

async function testSlug(chapterTitle: string) {
    const slugPrompt = `Convert this chapter title into a 2-4 word URL-friendly slug (lowercase, hyphens, no special chars).
Chapter: ${chapterTitle}
Return ONLY the slug, nothing else. Example: "javascript-promises" or "gradient-descent"`;

    let slug = chapterTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');

    try {
        const { client } = await import("../config/gemini");
        const slugResp = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: slugPrompt,
        });
        const geminiSlug = slugResp.text?.trim().replace(/[^a-z0-9-]/g, '').toLowerCase();
        if (geminiSlug && geminiSlug.length > 2) slug = geminiSlug;
    } catch (e: any) {
        console.warn("Slug fallback used:", e.message?.slice(0, 60));
    }

    const gfgUrl = `https://www.geeksforgeeks.org/${slug}/`;
    try {
        const gfgRes = await fetch(gfgUrl, { method: 'HEAD', redirect: 'follow' });
        console.log(`[${chapterTitle}]`);
        console.log(`  slug: ${slug}`);
        console.log(`  GFG: ${gfgRes.status} → ${gfgUrl}`);
    } catch (e: any) {
        console.log(`  GFG ERROR: ${e.message}`);
    }
}

async function main() {
    for (const ch of chapters) {
        await testSlug(ch);
        await new Promise(r => setTimeout(r, 2000)); // avoid rate limit
    }
}

main();
