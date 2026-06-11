import { google } from "googleapis";

export function validateYouTubeVideo(videoTitle: string, videoDescription: string, topic: string): boolean {
    const cleanTitle = videoTitle.toLowerCase();
    const cleanDesc = videoDescription.toLowerCase();
    
    // Obvious low-quality keywords to reject
    const lowQualityTerms = ["shorts", "clickbait", "teaser", "trailer", "reaction", "review", "gameplay", "unboxing", "tiktok"];
    if (lowQualityTerms.some(term => cleanTitle.includes(term))) {
        return false;
    }

    // Common stop words to exclude from keyword comparison
    const stopWords = new Set(["how", "to", "the", "and", "a", "an", "for", "with", "in", "on", "tutorial", "course", "video", "guide", "introduction", "basics"]);
    const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const keywords = cleanTopic.split(/\s+/).filter(k => k.length > 2 && !stopWords.has(k));

    if (keywords.length === 0) return true; // fallback if no valid keywords

    // Require at least one key technical word in the title
    const matchesTitle = keywords.some(kw => cleanTitle.includes(kw));
    // Calculate keyword coverage match ratio across title or description
    const matchedCount = keywords.filter(kw => cleanTitle.includes(kw) || cleanDesc.includes(kw)).length;
    const matchRatio = matchedCount / keywords.length;

    return matchesTitle && matchRatio >= 0.5;
}

export async function fetchValidatedYouTubeVideo(optimizedQuery: string, chapterTitle: string): Promise<string | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn("[YouTube] YOUTUBE_API_KEY missing.");
        return null;
    }

    try {
        const youtube = google.youtube({
            version: "v3",
            auth: apiKey,
        });

        const response = await youtube.search.list({
            part: ["snippet"],
            q: optimizedQuery,
            maxResults: 5, // fetch top 5 to filter
            type: ["video"],
            videoEmbeddable: "true",
            videoSyndicated: "true",
            videoDuration: "medium",
        });

        const items = response.data.items || [];
        if (items.length === 0) {
            return null;
        }

        // Return the first video that passes validation
        for (const item of items) {
            const title = item.snippet?.title || '';
            const description = item.snippet?.description || '';
            const videoId = item.id?.videoId;
            
            if (videoId && validateYouTubeVideo(title, description, chapterTitle)) {
                console.log(`[YouTube] Found validated video: "${title}" (ID: ${videoId})`);
                return videoId;
            }
        }

        // Fallback to the first result if none matched our strict filters
        return items[0].id?.videoId || null;
    } catch (error) {
        console.error("[YouTube] API Error:", error);
        return null;
    }
}
