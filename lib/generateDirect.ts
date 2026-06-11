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
    // 1. Fetch YouTube Video with validation
    const videoResult = await fetchValidatedYouTubeVideo(chapter, language || 'English', courseName);
    const youtubeVideoId = typeof videoResult === "string" ? videoResult : (videoResult?.videoId || null);
    const videoMetadata = typeof videoResult === "string" ? {} : (videoResult || {});

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
            videoContent: {
                subContent: chapter.subContent || [],
                videoLanguage: videoMetadata.videoLanguage || "English",
                isFallback: videoMetadata.isFallback || false,
                fallbackMessage: videoMetadata.fallbackMessage || "",
                alternativeVideos: videoMetadata.alternativeVideos || []
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("[DIRECT GEN] Successfully generated & persisted chapter:", chapter.chapterTitle);
    } catch (e) {
        console.error("[DIRECT GEN] DB insertion failed:", e);
    }
}
