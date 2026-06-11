import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaptersTable, chapterConceptsTable, conceptsTable, revisionScheduleTable, revisionQuestionsTable, courseTable } from "@/lib/schema";
import { eq, and, ilike } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { RetentionService } from "@/lib/retentionService";
import { client } from "@/lib/gemini";
import { fetchValidatedYouTubeVideo } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
        }

        const courseId = req.nextUrl.searchParams.get("courseId");
        const chapterId = req.nextUrl.searchParams.get("chapterId");

        if (!courseId || !chapterId) {
            return NextResponse.json({ error: "Missing courseId or chapterId" }, { status: 400 });
        }

        // 1. Fetch course details
        const courseRows = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
        if (courseRows.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const courseRow = courseRows[0];

        // 2. Fetch chapter from DB
        let chapterRows = await db.select().from(chaptersTable)
            .where(eq(chaptersTable.chapterId, chapterId))
            .limit(1);

        let chapterRow;

        if (chapterRows.length === 0) {
            console.log(`[CACHE MISS] Generating initial media content for chapter: ${chapterId}`);
            // Find chapter in course layout
            const layoutChapters = (courseRow.courseLayout as any)?.chapters || [];
            const chapterFromLayout = layoutChapters.find((ch: any) => `${courseId}-${ch.chapterId}` === chapterId);
            
            if (!chapterFromLayout) {
                return NextResponse.json({ error: "Chapter not found in course layout" }, { status: 404 });
            }

            // Attempt to fetch cached content from another course's chapter with the same title and same language
            const cachedChapters = await db.select({
                chapterTitle: chaptersTable.chapterTitle,
                youtubeVideoId: chaptersTable.youtubeVideoId,
                contentMaterials: chaptersTable.contentMaterials,
                videoContent: chaptersTable.videoContent
            })
            .from(chaptersTable)
            .innerJoin(courseTable, eq(chaptersTable.courseId, courseTable.courseId))
            .where(
                and(
                    ilike(chaptersTable.chapterTitle, chapterFromLayout.chapterTitle),
                    eq(courseTable.language, courseRow.language)
                )
            )
            .limit(1);

            if (cachedChapters.length > 0 && cachedChapters[0].youtubeVideoId) {
                console.log("[CACHE HIT] Reusing existing chapter content for:", chapterFromLayout.chapterTitle, "in language:", courseRow.language);
                const cached = cachedChapters[0];
                const inserted = await db.insert(chaptersTable).values({
                    courseId,
                    chapterId,
                    chapterTitle: cached.chapterTitle,
                    youtubeVideoId: cached.youtubeVideoId,
                    contentMaterials: cached.contentMaterials,
                    videoContent: cached.videoContent || { subContent: chapterFromLayout.subContent || [] }
                }).returning();
                chapterRow = inserted[0];
            } else {
                console.log("[GENERATING] Running YouTube and Google Custom Search APIs for:", chapterFromLayout.chapterTitle);
                const searchQuery = chapterFromLayout.webSearchQuery || `${courseRow.courseName} ${chapterFromLayout.chapterTitle}`;
                
                // Run YouTube + Google Search in PARALLEL instead of sequentially
                const [videoResult, articles] = await Promise.all([
                    fetchValidatedYouTubeVideo(chapterFromLayout, courseRow.language, courseRow.courseName),
                    fetchGoogleSearchMaterials(searchQuery)
                ]);

                const youtubeVideoId = typeof videoResult === "string" ? videoResult : (videoResult?.videoId || null);
                const videoMetadata = typeof videoResult === "string" ? {} : (videoResult || {});

                const materials = { articles };

                const inserted = await db.insert(chaptersTable).values({
                    courseId,
                    chapterId,
                    chapterTitle: chapterFromLayout.chapterTitle,
                    youtubeVideoId: youtubeVideoId,
                    contentMaterials: materials,
                    videoContent: { 
                        subContent: chapterFromLayout.subContent || [],
                        videoLanguage: videoMetadata.videoLanguage || "English",
                        isFallback: videoMetadata.isFallback || false,
                        fallbackMessage: videoMetadata.fallbackMessage || "",
                        alternativeVideos: videoMetadata.alternativeVideos || []
                    }
                }).returning();
                chapterRow = inserted[0];
            }
        } else {
            chapterRow = chapterRows[0];
        }

        let materials = chapterRow.contentMaterials as any;
        if (typeof materials === "string") {
            try {
                materials = JSON.parse(materials);
            } catch (e) {
                materials = { articles: [] };
            }
        } else if (!materials) {
            materials = { articles: [] };
        }

        let summary = materials.summary || "";
        let workedExamples = materials.workedExamples || [];

        // 3. Generate Summary and Worked Examples dynamically if missing
        if (!summary || workedExamples.length === 0) {
            console.log(`Generating summary & worked examples for chapter: ${chapterRow.chapterTitle}`);
            try {
                const subContent = (chapterRow.videoContent as any)?.subContent || [];
                const prompt = `
You are an expert instructor in software engineering.
For the chapter titled "${chapterRow.chapterTitle}" covering: ${JSON.stringify(subContent)}.
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
                    }
                });

                const rawResult = resp.text || '';
                const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const data = JSON.parse(sanitizedResult);

                summary = data.summary || "Summary generation in progress...";
                workedExamples = data.workedExamples || [];

                // Update contentMaterials in DB
                materials.summary = summary;
                materials.workedExamples = workedExamples;
                
                await db.update(chaptersTable)
                    .set({ contentMaterials: materials })
                    .where(eq(chaptersTable.chapterId, chapterId));

            } catch (err) {
                console.error("Failed to generate summary/examples via Gemini:", err);
                summary = `This chapter covers the core topics of ${chapterRow.chapterTitle}. Play the video to learn more.`;
                workedExamples = [
                    { title: "Sample Implementation", code: `// Study the concepts in this chapter.`, explanation: "Refer to video for full details." }
                ];
            }
        }

        // 4. Fire-and-forget: Extract concepts and generate revision questions in background
        // These are Gemini calls that can take 10-30s each — don't block the response
        const backgroundWork = Promise.allSettled([
            RetentionService.extractConceptsForChapter(chapterId, chapterRow.chapterTitle, JSON.stringify(materials)),
            RetentionService.generateRevisionQuestions(chapterId, chapterRow.chapterTitle, JSON.stringify(materials))
        ]).catch(err => console.error("[Background] Concept/question generation failed:", err));

        // 5. Fetch existing concept data and questions in PARALLEL (these are fast DB reads)
        const [linkedConceptsList, existingQuestions, schedules, readiness] = await Promise.all([
            db.select().from(chapterConceptsTable).where(eq(chapterConceptsTable.chapterId, chapterId)),
            db.select().from(revisionQuestionsTable).where(eq(revisionQuestionsTable.chapterId, chapterId)),
            db.select().from(revisionScheduleTable)
                .where(
                    and(
                        eq(revisionScheduleTable.userId, safeUserEmail),
                        eq(revisionScheduleTable.chapterId, chapterId)
                    )
                )
                .orderBy(revisionScheduleTable.reviewNumber),
            RetentionService.getConceptReadiness(safeUserEmail)
        ]);

        // Filter concepts linked to this chapter
        const linkedIds = new Set(linkedConceptsList.map(l => l.conceptId));
        const chapterConcepts = readiness.concepts.filter(c => linkedIds.has(c.id));

        // Determine related concepts from relationships
        const relatedIds = new Set<string>();
        readiness.relationships.forEach(rel => {
            if (linkedIds.has(rel.sourceConceptId)) {
                relatedIds.add(rel.targetConceptId);
            }
            if (linkedIds.has(rel.targetConceptId)) {
                relatedIds.add(rel.sourceConceptId);
            }
        });
        // Remove self
        linkedIds.forEach(id => relatedIds.delete(id));
        const relatedConcepts = readiness.concepts.filter(c => relatedIds.has(c.id));

        const currentActiveSchedule = schedules.find(s => s.status === "PENDING" || s.status === "MISSED") || schedules[schedules.length - 1] || null;

        const videoContent = (chapterRow.videoContent as any) || {};
        const videoLanguage = videoContent.videoLanguage || "English";
        const isFallback = videoContent.isFallback || false;
        const fallbackMessage = videoContent.fallbackMessage || "";
        const alternativeVideos = videoContent.alternativeVideos || [];

        return NextResponse.json({
            youtubeVideoId: chapterRow.youtubeVideoId || null,
            chapterTitle: chapterRow.chapterTitle,
            videoLanguage,
            isFallback,
            fallbackMessage,
            alternativeVideos,
            summary,
            workedExamples,
            concepts: chapterConcepts,
            relatedConcepts: relatedConcepts.slice(0, 5), // return max 5 related
            recallQuestions: existingQuestions,
            revisionStatus: currentActiveSchedule ? {
                id: currentActiveSchedule.id,
                reviewNumber: currentActiveSchedule.reviewNumber,
                scheduledAt: currentActiveSchedule.scheduledAt,
                status: currentActiveSchedule.status,
                easeFactor: currentActiveSchedule.easeFactor,
                completedAt: currentActiveSchedule.completedAt
            } : null
        });

    } catch (error: any) {
        console.error("GET /api/course/chapter-learning error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
