import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { chaptersTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { fetchValidatedYouTubeVideo } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";

export const generateVideoContentJob = inngest.createFunction(
    { id: "generate-video-content", triggers: [{ event: "video/generate" }] },
    async ({ event, step }) => {
        const { chapter, courseId, courseName, language } = event.data;

        console.log("[BACKGROUND JOB] Starting video content generation for chapter:", chapter.chapterTitle, "in language:", language || 'English');
        const newChapterId = `${courseId}-${chapter.chapterId}`;

        // Step 1: Extract pre-generated YouTube search query
        const optimizedQuery = chapter.youtubeQuery || `${courseName || ''} ${chapter.chapterTitle} tutorial`;

        // Step 2: Fetch relevant YouTube Video using validation
        const videoResult = await step.run("fetch-youtube-video", async () => {
            return await fetchValidatedYouTubeVideo(chapter, language || 'English', courseName);
        });

        const youtubeVideoId = typeof videoResult === "string" ? videoResult : (videoResult?.videoId || null);
        const videoMetadata = typeof videoResult === "string" ? {} : (videoResult || {});

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
        });

        return { success: true, newChapterId, youtubeVideoId, materials };
    }
);


