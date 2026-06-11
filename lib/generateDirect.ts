import { db } from "@/lib/db";
import { chaptersTable } from "@/lib/schema";
import { fetchValidatedYouTubeVideo } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";

export async function generateChapterContentDirect({
    chapter,
    courseId,
    courseName,
    language
}: {
    chapter: any;
    courseId: string;
    courseName: string;
    language: string;
}) {
    console.log("[DIRECT GEN] Starting video content generation for chapter:", chapter.chapterTitle);
    const newChapterId = `${courseId}-${chapter.chapterId}`;
    const optimizedQuery = chapter.youtubeQuery || `${courseName || ''} ${chapter.chapterTitle} tutorial`;

    // 1. Fetch YouTube Video with validation
    const youtubeVideoId = await fetchValidatedYouTubeVideo(optimizedQuery, chapter.chapterTitle);

    // 2. Fetch Study Materials via Google Search API
    const query = chapter.webSearchQuery || `${courseName || ''} ${chapter.chapterTitle}`;
    const articles = await fetchGoogleSearchMaterials(query);

    // 3. Persist to DB
    try {
        await db.insert(chaptersTable).values({
            courseId,
            chapterId: newChapterId,
            chapterTitle: chapter.chapterTitle || '',
            youtubeVideoId: youtubeVideoId,
            contentMaterials: { articles },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("[DIRECT GEN] Successfully generated & persisted chapter:", chapter.chapterTitle);
    } catch (e) {
        console.error("[DIRECT GEN] DB insertion failed:", e);
    }
}
