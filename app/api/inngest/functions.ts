import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { chaptersTable, courseTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { fetchValidatedYouTubeVideo, fetchYouTubeTranscript } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";
// TODO: Re-enable in future release
// import { RetentionService } from "@/lib/retentionService";
import { eq } from "drizzle-orm";

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

export const processChapterJob = inngest.createFunction(
    { id: "process-chapter-job", triggers: [{ event: "chapter/process" }] },
    async ({ event, step }) => {
        const { courseId, chapterId, chapterTitle, youtubeVideoId } = event.data;

        console.log(`[BACKGROUND JOB] Processing chapter data for: ${chapterTitle} (${chapterId})`);

        // Step 1: Fetch chapter from DB to check materials
        const chapterData = await step.run("fetch-chapter-data", async () => {
            const rows = await db.select().from(chaptersTable).where(eq(chaptersTable.chapterId, chapterId)).limit(1);
            return rows.length > 0 ? rows[0] : null;
        });

        if (!chapterData) {
            console.error(`[BACKGROUND JOB] Chapter not found in DB: ${chapterId}`);
            return { success: false, error: "Chapter not found" };
        }

        // Fetch course structure
        const courseData = await step.run("fetch-course-data", async () => {
            const rows = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
            return rows.length > 0 ? rows[0] : null;
        });

        const layout = courseData?.courseLayout as any;
        const isPlaylistOrHybrid = layout && (layout.playlistId || layout.mode === 'playlist' || layout.mode === 'hybrid');

        let materials = chapterData.contentMaterials as any;
        if (typeof materials === "string") {
            try {
                materials = JSON.parse(materials);
            } catch {
                materials = { articles: [] };
            }
        } else if (!materials) {
            materials = { articles: [] };
        }

        let summary = materials.summary || "";
        let workedExamples = materials.workedExamples || [];

        // Step 2: Generate summary and worked examples if missing
        if (!summary || workedExamples.length === 0) {
            const generated = await step.run("generate-summary-examples", async () => {
                const subContent = (chapterData.videoContent as any)?.subContent || [];
                const prompt = `
You are an expert instructor in software engineering.
For the chapter titled "${chapterTitle}" covering: ${JSON.stringify(subContent)}.
Generate:
1. An engaging, clear, and comprehensive Chapter Summary (2-3 paragraphs explaining the core principles, why they matter, and how they fit into the broader system).
2. A list of 2-3 Worked Examples. Each example must have:
   - title: Title of the example
   - code: Actual clean code snippet (in JavaScript, Python, or TypeScript) or step-by-step logic
   - explanation: In-depth explanation of how it works and the logic behind it

Return the response ONLY as a valid JSON object matching the schema:
{
  "summary": "Summary text...",
  "workedExamples": [
    {
      "title": "Example Title",
      "code": "code snippet...",
      "explanation": "Explanation..."
    }
  ]
}
`;
                const resp = await client.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        topic: chapterTitle,
                        contentType: "summary"
                    }
                });

                const rawResult = resp.text || '';
                const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                return JSON.parse(sanitizedResult);
            });

            summary = generated.summary || "Summary generated.";
            workedExamples = generated.workedExamples || [];

            materials.summary = summary;
            materials.workedExamples = workedExamples;

            await step.run("save-summary-examples", async () => {
                await db.update(chaptersTable)
                    .set({ contentMaterials: materials })
                    .where(eq(chaptersTable.chapterId, chapterId));
            });
        }

        // Step 3: Fetch transcript if it's playlist/hybrid and youtubeVideoId is available
        let transcript: string | null = null;
        if (isPlaylistOrHybrid && youtubeVideoId) {
            transcript = await step.run("fetch-transcript", async () => {
                try {
                    return await fetchYouTubeTranscript(youtubeVideoId);
                } catch (err) {
                    console.error("[BACKGROUND JOB] fetchYouTubeTranscript failed:", err);
                    return null;
                }
            });
        }

        // TODO: Re-enable in future release
        /*
        // Step 4: Extract concepts, questions, and graphs
        if (isPlaylistOrHybrid && youtubeVideoId && transcript) {
            await step.run("playlist-concepts-and-graph", async () => {
                await RetentionService.extractPlaylistConceptsAndGraph(courseId, youtubeVideoId, chapterId, chapterTitle, transcript!);
            });
            await step.run("playlist-revision-questions", async () => {
                await RetentionService.generateRevisionQuestions(chapterId, chapterTitle, transcript!);
            });
            await step.run("playlist-concepts-for-chapter", async () => {
                await RetentionService.extractConceptsForChapter(chapterId, chapterTitle, transcript!);
            });
        } else {
            const contextText = transcript || JSON.stringify(materials);
            await step.run("standard-concepts-for-chapter", async () => {
                await RetentionService.extractConceptsForChapter(chapterId, chapterTitle, contextText);
            });
            await step.run("standard-revision-questions", async () => {
                await RetentionService.generateRevisionQuestions(chapterId, chapterTitle, contextText);
            });
        }
        */
        console.log(`[BACKGROUND JOB] Spaced repetition / concept generation skipped (temporarily disabled)`);

        console.log(`[BACKGROUND JOB] Chapter data processed successfully for: ${chapterTitle}`);
        return { success: true };
    }
);


