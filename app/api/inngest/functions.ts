import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { chaptersTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { fetchValidatedYouTubeVideo } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";

export const generateVideoContentJob = inngest.createFunction(
    { id: "generate-video-content" },
    { event: "video/generate" },
    async ({ event, step }) => {
        const { chapter, courseId, courseName, language } = event.data;

        console.log("[BACKGROUND JOB] Starting video content generation for chapter:", chapter.chapterTitle, "in language:", language || 'English');
        const newChapterId = `${courseId}-${chapter.chapterId}`;

        // Step 1: Extract pre-generated YouTube search query
        const optimizedQuery = chapter.youtubeQuery || `${courseName || ''} ${chapter.chapterTitle} tutorial`;

        // Step 2: Fetch relevant YouTube Video using validation
        const youtubeVideoId = await step.run("fetch-youtube-video", async () => {
            return await fetchValidatedYouTubeVideo(optimizedQuery, chapter.chapterTitle);
        });

        // Step 3: Fetch Study Materials via Google Search API
        const materials = await step.run("generate-chapter-materials", async () => {
            const query = chapter.webSearchQuery || `${courseName || ''} ${chapter.chapterTitle}`;
            const articles = await fetchGoogleSearchMaterials(query);
            return { articles };
        });

        // Step 4: Database Persist
        await step.run("persist-to-database", async () => {
            await db.insert(chaptersTable).values({
                courseId,
                chapterId: newChapterId,
                chapterTitle: chapter.chapterTitle || '',
                youtubeVideoId: youtubeVideoId,
                contentMaterials: materials,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        return { success: true, newChapterId, youtubeVideoId, materials };
    }
);

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
