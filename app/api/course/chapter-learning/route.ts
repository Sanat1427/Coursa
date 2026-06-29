import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaptersTable, chapterConceptsTable, conceptsTable, revisionScheduleTable, revisionQuestionsTable, courseTable, userProgressTable } from "@/lib/schema";
import { eq, and, ilike } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
// TODO: Re-enable in future release
// import { RetentionService } from "@/lib/retentionService";
import { fetchValidatedYouTubeVideo } from "@/lib/youtube";
import { fetchGoogleSearchMaterials } from "@/lib/googleSearch";
import { inngest } from "@/lib/inngest";
import { buildChapterSummaryPrompt, parseAndValidateChapterContent, saveChapterContent } from "@/lib/chapterService";

export async function GET(req: NextRequest) {
    try {
        // [STEP 1] User Authenticated
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
        }
        console.log(`[STEP 1] User Authenticated: ${safeUserEmail}`);

        const courseId = req.nextUrl.searchParams.get("courseId");
        const chapterId = req.nextUrl.searchParams.get("chapterId");

        if (!courseId || !chapterId) {
            return NextResponse.json({ error: "Missing courseId or chapterId" }, { status: 400 });
        }

        // [STEP 2] Course Loaded
        const courseRows = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
        if (courseRows.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const courseRow = courseRows[0];
        console.log(`[STEP 2] Course Loaded: ${courseId}`);

        // [STEP 3] Chapter Loaded
        let chapterRows = await db.select().from(chaptersTable)
            .where(eq(chaptersTable.chapterId, chapterId))
            .limit(1);

        let chapterRow = chapterRows[0];

        const isMediaMissing = !chapterRow || !chapterRow.youtubeVideoId;

        if (isMediaMissing) {
            console.log(`[MEDIA MISS] Generating initial media content for chapter: ${chapterId}`);
            // Find chapter in course layout safely
            const layoutChapters = (courseRow?.courseLayout as any)?.chapters || [];
            const chapterFromLayout = layoutChapters.find((ch: any) => `${courseId}-${ch.chapterId || ch.id}` === chapterId);
            
            if (!chapterFromLayout) {
                return NextResponse.json({ error: "Chapter not found in course layout" }, { status: 404 });
            }

            // Attempt to fetch cached content from another chapter with same title and language
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
                console.log("[CACHE HIT] Reusing existing chapter content for:", chapterFromLayout.chapterTitle);
                const cached = cachedChapters[0];
                if (chapterRow) {
                    const updated = await db.update(chaptersTable).set({
                        youtubeVideoId: cached.youtubeVideoId,
                        contentMaterials: cached.contentMaterials,
                        videoContent: cached.videoContent || { subContent: chapterFromLayout.subContent || [] }
                    }).where(eq(chaptersTable.chapterId, chapterId)).returning();
                    chapterRow = updated[0];
                } else {
                    const inserted = await db.insert(chaptersTable).values({
                        courseId,
                        chapterId,
                        chapterTitle: cached.chapterTitle,
                        youtubeVideoId: cached.youtubeVideoId,
                        contentMaterials: cached.contentMaterials,
                        videoContent: cached.videoContent || { subContent: chapterFromLayout.subContent || [] }
                    }).returning();
                    chapterRow = inserted[0];
                }
            } else {
                console.log("[GENERATING] Running YouTube and Google Custom Search APIs for:", chapterFromLayout.chapterTitle);
                const searchQuery = chapterFromLayout.webSearchQuery || `${courseRow.courseName} ${chapterFromLayout.chapterTitle}`;
                
                const [videoResult, articles] = await Promise.all([
                    fetchValidatedYouTubeVideo(chapterFromLayout, courseRow.language, courseRow.courseName),
                    fetchGoogleSearchMaterials(searchQuery)
                ]);

                const youtubeVideoId = typeof videoResult === "string" ? videoResult : (videoResult?.videoId || null);
                const videoMetadata = typeof videoResult === "string" ? {} : (videoResult || {});
                const materials = { articles };

                if (chapterRow) {
                    const updated = await db.update(chaptersTable).set({
                        youtubeVideoId: youtubeVideoId,
                        contentMaterials: materials,
                        videoContent: { 
                            subContent: chapterFromLayout.subContent || [],
                            videoLanguage: videoMetadata.videoLanguage || "English",
                            isFallback: videoMetadata.isFallback || false,
                            fallbackMessage: videoMetadata.fallbackMessage || "",
                            alternativeVideos: videoMetadata.alternativeVideos || []
                        }
                    }).where(eq(chaptersTable.chapterId, chapterId)).returning();
                    chapterRow = updated[0];
                } else {
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
            }
        }

        if (!chapterRow) {
            throw new Error("Failed to retrieve or initialize chapter row.");
        }
        console.log(`[STEP 3] Chapter Loaded: ${chapterId}`);

        // [STEP 4] Materials Loaded
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

        let summary = materials?.summary || "";
        let workedExamples = materials?.workedExamples || [];

        // Dynamic placeholder summary handling - NEVER block on Gemini
        if (!summary || workedExamples.length === 0) {
            console.log(`[STEP 4] Materials Loaded (Warning: Summary missing, returning processing placeholder)`);
            summary = "This chapter is being processed. Learning content will be available shortly.";
            workedExamples = [
                {
                    title: "Processing Content...",
                    code: "// Summary and worked examples are generating in the background.",
                    explanation: "Please refresh the page in a few moments to view the fully parsed content."
                }
            ];
        } else {
            console.log(`[STEP 4] Materials Loaded`);
        }

        // [STEP 5] Concepts Loaded
        // TODO: Re-enable in future release
        /*
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
        */

        const linkedConceptsList: any[] = [];
        const existingQuestions: any[] = [];
        const schedules: any[] = [];
        const readiness = { concepts: [] as any[], relationships: [] as any[] };

        // Filter concepts linked to this chapter safely
        const linkedIds = new Set((linkedConceptsList || []).map(l => l.conceptId));
        const chapterConcepts = (readiness?.concepts || []).filter(c => linkedIds.has(c.id));

        // Determine related concepts from relationships safely
        const relatedIds = new Set<string>();
        (readiness?.relationships || []).forEach(rel => {
            if (rel) {
                if (linkedIds.has(rel.sourceConceptId)) {
                    relatedIds.add(rel.targetConceptId);
                }
                if (linkedIds.has(rel.targetConceptId)) {
                    relatedIds.add(rel.sourceConceptId);
                }
            }
        });
        linkedIds.forEach(id => relatedIds.delete(id));
        const relatedConcepts = (readiness?.concepts || []).filter(c => relatedIds.has(c.id));

        const currentActiveSchedule = (schedules || []).find(s => s?.status === "PENDING" || s?.status === "MISSED") || 
            (schedules && schedules.length > 0 ? schedules[schedules.length - 1] : null);

        const videoContent = (chapterRow.videoContent as any) || {};
        const videoLanguage = videoContent.videoLanguage || "English";
        const isFallback = videoContent.isFallback || false;
        const fallbackMessage = videoContent.fallbackMessage || "";
        const alternativeVideos = videoContent.alternativeVideos || [];

        console.log(`[STEP 5] Concepts Loaded`);

        // Queue background processing event if any key elements are missing
        const isDataMissing = !materials?.summary || 
                              !materials?.workedExamples || 
                              materials.workedExamples.length === 0;

        if (isDataMissing) {
            console.log(`[Queueing Inngest] Sending chapter/process event for chapterId: ${chapterId}`);
            inngest.send({
                name: "chapter/process",
                data: {
                    courseId,
                    chapterId,
                    chapterTitle: chapterRow.chapterTitle,
                    youtubeVideoId: chapterRow.youtubeVideoId
                }
            }).catch(async (inngestErr) => {
                console.error("[Queueing Inngest Error] Failed to send chapter/process event:", inngestErr);
                
                // Fallback for local development when Inngest dev server is not running
                if (process.env.NODE_ENV === "development") {
                    console.log("[Local Dev Fallback] Inngest dev server not detected/running. Executing processing job in local background thread...");
                    
                    try {
                        const { client } = await import("@/lib/gemini");
                        const { fetchYouTubeTranscript } = await import("@/lib/youtube");
                        
                        const runLocalFallback = async () => {
                            try {
                                const layout = courseRow?.courseLayout as any;
                                const isPlaylistOrHybrid = layout && (layout.playlistId || layout.mode === 'playlist' || layout.mode === 'hybrid');

                                let currentMaterials = chapterRow.contentMaterials as any;
                                if (typeof currentMaterials === "string") {
                                    try { currentMaterials = JSON.parse(currentMaterials); } catch { currentMaterials = { articles: [] }; }
                                } else if (!currentMaterials) {
                                    currentMaterials = { articles: [] };
                                }

                                let localSummary = currentMaterials.summary || "";
                                let localExamples = currentMaterials.workedExamples || [];

                                if (!localSummary || localExamples.length === 0) {
                                    console.log(`[Local Fallback] Generating summary & examples for: ${chapterRow.chapterTitle}`);
                                    const subContent = (chapterRow.videoContent as any)?.subContent || [];
                                    const prompt = buildChapterSummaryPrompt(chapterRow.chapterTitle, subContent);
                                    
                                    const resp = await client.models.generateContent({
                                        model: 'gemini-2.5-flash',
                                        contents: prompt,
                                        config: {
                                            responseMimeType: "application/json",
                                            topic: chapterRow.chapterTitle,
                                            contentType: "summary"
                                        }
                                    });

                                    const rawResult = resp.text || '';
                                    const content = parseAndValidateChapterContent(rawResult);

                                    await saveChapterContent(chapterId, content);

                                    localSummary = content.summary;
                                    localExamples = content.workedExamples;
                                    console.log(`[Local Fallback] Summary & worked examples generated successfully.`);
                                }

                                let transcript: string | null = null;
                                if (isPlaylistOrHybrid && chapterRow.youtubeVideoId) {
                                    try {
                                        transcript = await fetchYouTubeTranscript(chapterRow.youtubeVideoId);
                                    } catch (err) {
                                        console.error("[Local Fallback] fetchYouTubeTranscript failed:", err);
                                    }
                                }

                                // TODO: Re-enable in future release
                                /*
                                if (isPlaylistOrHybrid && chapterRow.youtubeVideoId && transcript) {
                                    await RetentionService.extractPlaylistConceptsAndGraph(courseId, chapterRow.youtubeVideoId, chapterId, chapterRow.chapterTitle, transcript);
                                    await RetentionService.generateRevisionQuestions(chapterId, chapterRow.chapterTitle, transcript);
                                    await RetentionService.extractConceptsForChapter(chapterId, chapterRow.chapterTitle, transcript);
                                } else {
                                    const contextText = transcript || JSON.stringify(currentMaterials);
                                    await RetentionService.extractConceptsForChapter(chapterId, chapterRow.chapterTitle, contextText);
                                    await RetentionService.generateRevisionQuestions(chapterId, chapterRow.chapterTitle, contextText);
                                }
                                */
                                console.log("[Local Fallback] Spaced repetition / concept generation skipped (temporarily disabled)");
                                console.log(`[Local Fallback] Success: processed all chapter data for: ${chapterRow.chapterTitle}`);
                            } catch (fallbackErr) {
                                console.error("[Local Fallback Job Error] Failed to process:", fallbackErr);
                            }
                        };

                        runLocalFallback().catch(err => console.error("[Local Fallback Job Thread Error]", err));

                    } catch (importErr) {
                        console.error("[Local Fallback Import Error] Failed to load local modules:", importErr);
                    }
                }
            });
        }

        // [STEP 6] Progress Updated
        const existingProgress = await db.select().from(userProgressTable)
            .where(
                and(
                    eq(userProgressTable.userId, safeUserEmail),
                    eq(userProgressTable.courseId, courseId),
                    eq(userProgressTable.chapterId, chapterId)
                )
            )
            .limit(1);

        let progressRow;
        if (existingProgress && existingProgress.length > 0) {
            const progressId = existingProgress[0]?.id;
            const progressViews = existingProgress[0]?.views || 0;
            const updated = await db.update(userProgressTable)
                .set({
                    views: progressViews + 1,
                    lastVisitedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(userProgressTable.id, progressId))
                .returning();
            progressRow = updated[0];
        } else {
            const inserted = await db.insert(userProgressTable)
                .values({
                    userId: safeUserEmail,
                    courseId,
                    chapterId,
                    status: 'NOT_STARTED',
                    progressPercentage: 0,
                    views: 1,
                    lastVisitedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();
            progressRow = inserted[0];
        }
        console.log(`[STEP 6] Progress Updated`);

        // [STEP 7] Response Sent
        console.log(`[STEP 7] Response Sent for chapter: ${chapterId}`);
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
            relatedConcepts: relatedConcepts.slice(0, 5),
            recallQuestions: existingQuestions || [],
            progress: progressRow,
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
        return NextResponse.json({ 
            error: error.message || "Internal Server Error", 
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
        }, { status: 500 });
    }
}
