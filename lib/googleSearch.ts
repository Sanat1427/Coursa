export interface SearchMaterial {
    source: string;
    title: string;
    url: string;
}

export async function fetchGoogleSearchMaterials(query: string): Promise<SearchMaterial[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (apiKey && cx) {
        try {
            const restrictedQuery = `${query} site:developer.mozilla.org OR site:en.wikipedia.org`;
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(restrictedQuery)}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const items = data.items || [];
                
                const results = items.map((item: any) => {
                    const link = item.link || '';
                    let source = "Web";
                    if (link.includes("developer.mozilla.org")) {
                        source = "MDN Web Docs";
                    } else if (link.includes("wikipedia.org")) {
                        source = "Wikipedia";
                    }
                    return {
                        source,
                        title: item.title || "Reference Material",
                        url: link
                    };
                }).slice(0, 3);

                if (results.length > 0) {
                    return results;
                }
            } else {
                if (res.status === 403) {
                    console.warn(
                        `\n[GoogleSearch] Custom Search returned 403 Forbidden. Using keyless fallbacks.\n` +
                        `  -> Custom Search API is likely disabled for this key in Cloud Console.\n` +
                        `  -> Enable it at: https://console.cloud.google.com/apis/library/customsearch.googleapis.com\n`
                    );
                } else {
                    console.warn(`[GoogleSearch] Custom Search returned status ${res.status}. Using keyless fallbacks.`);
                }
            }
        } catch (err) {
            console.warn("[GoogleSearch] Custom Search request failed. Using keyless fallbacks.", err);
        }
    } else {
        console.warn("[GoogleSearch] API credentials missing. Using keyless fallbacks.");
    }

    // Keyless Fallback implementation: query MDN & Wikipedia directly
    try {
        console.log(`[GoogleSearch] Querying keyless fallbacks for Wikipedia and MDN: "${query}"`);
        const results: SearchMaterial[] = [];

        // Fetch URLs
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`;
        const mdnUrl = `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(query)}`;

        const [wikiRes, mdnRes] = await Promise.allSettled([
            fetch(wikiUrl).then(r => r.json()),
            fetch(mdnUrl).then(r => r.json())
        ]);

        // Parse MDN Web Docs search results
        if (mdnRes.status === 'fulfilled' && mdnRes.value && mdnRes.value.documents) {
            const mdnDocs = mdnRes.value.documents.slice(0, 2);
            for (const doc of mdnDocs) {
                if (doc.mdn_url && doc.title) {
                    results.push({
                        source: "MDN Web Docs",
                        title: doc.title,
                        url: `https://developer.mozilla.org${doc.mdn_url}`
                    });
                }
            }
        }

        // Parse Wikipedia search results
        if (wikiRes.status === 'fulfilled' && wikiRes.value && Array.isArray(wikiRes.value)) {
            const [, titles, , urls] = wikiRes.value;
            if (Array.isArray(titles) && Array.isArray(urls)) {
                const count = Math.min(titles.length, urls.length, 2);
                for (let i = 0; i < count; i++) {
                    results.push({
                        source: "Wikipedia",
                        title: titles[i],
                        url: urls[i]
                    });
                }
            }
        }

        return results.slice(0, 3);
    } catch (fallbackErr) {
        console.error("[GoogleSearch] Fallback fetch failed:", fallbackErr);
        return [];
    }
}
