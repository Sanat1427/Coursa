import { db } from "@/lib/db";
import { chaptersTable, courseTable, userProgressTable, quizzesTable, questionsTable, quizAttemptsTable, quizAnswersTable, notesTable, bookmarksTable } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');
        const user = await currentUser();
        const userId = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!courseId) {
            const usercourses = await db.select().from(courseTable)
                .where(eq(courseTable.userId, userId)).orderBy(courseTable.createdAt);
            
            const courseIds = usercourses.map(c => c.courseId);
            if (courseIds.length > 0) {
                const allProgress = await db.select().from(userProgressTable)
                    .where(
                        and(
                            eq(userProgressTable.userId, userId),
                            inArray(userProgressTable.courseId, courseIds)
                        )
                    );

                const coursesWithProgress = usercourses.map(course => {
                    const courseChapters = (course.courseLayout as any)?.chapters || [];
                    const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
                    
                    const completedChapters = allProgress.filter(p => p.courseId === course.courseId && p.status === 'COMPLETED').length;
                    const remainingChapters = Math.max(0, totalChapters - completedChapters);
                    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

                    return {
                        ...course,
                        completedChapters,
                        remainingChapters,
                        progressPercentage
                    };
                });
                return NextResponse.json(coursesWithProgress);
            }
            return NextResponse.json(usercourses);
        }

        console.log(`Fetching Course: ID=${courseId}, UserID=${userId}`);

        const courses = await db.select({
            courseId: courseTable.courseId,
            courseName: courseTable.courseName,
            userInput: courseTable.userInput,
            type: courseTable.type,
            courseLayout: courseTable.courseLayout,
            createdAt: courseTable.createdAt,
            updatedAt: courseTable.updatedAt,
        }).from(courseTable).where(
            and(
                eq(courseTable.courseId, courseId),
                eq(courseTable.userId, userId)
            )
        );

        if (!courses || courses.length === 0) {
            console.warn(`Course 404: courseId doesn't exist or userId doesn't match!`);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const chapters = await db.select().from(chaptersTable)
            .where(eq(chaptersTable?.courseId, courseId as string));

        return NextResponse.json({
            ...courses[0],
            chapters: chapters
        });
    } catch (e: any) {
        console.error("GET /api/course error: ", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}

import { chapterContentSlidesTable } from "@/lib/schema";

// Inside the same file route.ts:

export async function DELETE(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');
        const user = await currentUser();

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        // 1. Verify Ownership
        const course = await db.select().from(courseTable).where(
            and(
                eq(courseTable.courseId, courseId),
                eq(courseTable.userId, safeUserEmail)
            )
        );

        if (!course || course.length === 0) {
            return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
        }

        // 2. Cascade Delete: Delete child tables referencing chapters/courses first to prevent foreign key violations

        // 2.1. Delete quiz answers, attempts, questions, and quizzes
        const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.courseId, courseId));
        const quizIds = quizzes.map(q => q.quizId);
        if (quizIds.length > 0) {
            const attempts = await db.select().from(quizAttemptsTable).where(inArray(quizAttemptsTable.quizId, quizIds));
            const attemptIds = attempts.map(a => a.attemptId);
            if (attemptIds.length > 0) {
                await db.delete(quizAnswersTable).where(inArray(quizAnswersTable.attemptId, attemptIds));
            }
            await db.delete(quizAttemptsTable).where(inArray(quizAttemptsTable.quizId, quizIds));
            await db.delete(questionsTable).where(inArray(questionsTable.quizId, quizIds));
            await db.delete(quizzesTable).where(inArray(quizzesTable.quizId, quizIds));
        }

        // 2.2. Delete notes and bookmarks
        await db.delete(notesTable).where(eq(notesTable.courseId, courseId));
        await db.delete(bookmarksTable).where(eq(bookmarksTable.courseId, courseId));

        // 2.3. Delete slides
        await db.delete(chapterContentSlidesTable)
            .where(eq(chapterContentSlidesTable.courseId, courseId));

        // 2.4. Delete progress records
        await db.delete(userProgressTable)
            .where(eq(userProgressTable.courseId, courseId));

        // 3. Delete chapters which depend on course
        await db.delete(chaptersTable)
            .where(eq(chaptersTable.courseId, courseId));

        // 4. Delete the main course record
        await db.delete(courseTable)
            .where(eq(courseTable.courseId, courseId));

        return NextResponse.json({ success: true, message: "Course deleted successfully" });
    } catch (e: any) {
        console.error("Internal Server Error (DELETE): ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chapterId, videoId } = await req.json();

        if (!chapterId || !videoId) {
            return NextResponse.json({ error: "chapterId and videoId are required" }, { status: 400 });
        }

        // Fetch the chapter
        const chapterRows = await db.select().from(chaptersTable).where(eq(chaptersTable.chapterId, chapterId)).limit(1);
        if (chapterRows.length === 0) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        const chapterRow = chapterRows[0];
        const videoContent = (chapterRow.videoContent as any) || {};

        const currentId = chapterRow.youtubeVideoId;
        const currentLang = videoContent.videoLanguage || "English";

        // Find the chosen alternative video
        const alternatives = videoContent.alternativeVideos || [];
        const chosenAlt = alternatives.find((a: any) => a.videoId === videoId);

        // Reconstruct alternatives list
        let updatedAlternatives = alternatives.filter((a: any) => a.videoId !== videoId);
        if (currentId) {
            if (!updatedAlternatives.some((a: any) => a.videoId === currentId)) {
                updatedAlternatives.push({
                    videoId: currentId,
                    title: "Previous Video Selection",
                    channelTitle: "",
                    language: currentLang,
                    score: 10
                });
            }
        }

        const newVideoLanguage = chosenAlt ? chosenAlt.language : "English";

        // Fetch course language to align fallback state
        const courseRows = await db.select({ language: courseTable.language })
            .from(courseTable)
            .where(eq(courseTable.courseId, chapterRow.courseId))
            .limit(1);
        
        let isFallback = videoContent.isFallback || false;
        let fallbackMessage = videoContent.fallbackMessage || "";

        if (courseRows.length > 0) {
            const courseLang = courseRows[0].language;
            const matchesTarget = (courseLang.toLowerCase() === newVideoLanguage.toLowerCase()) ||
                                  ((courseLang.toLowerCase() === "hindi" || courseLang.toLowerCase() === "hinglish") && 
                                   (newVideoLanguage.toLowerCase() === "hindi" || newVideoLanguage.toLowerCase() === "hinglish"));
            if (matchesTarget) {
                isFallback = false;
                fallbackMessage = "";
            } else if (courseLang.toLowerCase() !== "english") {
                isFallback = true;
                fallbackMessage = `We couldn't find a high-quality ${courseLang} video for this chapter. Showing alternative.`;
            }
        }

        await db.update(chaptersTable)
            .set({
                youtubeVideoId: videoId,
                videoContent: {
                    ...videoContent,
                    videoLanguage: newVideoLanguage,
                    isFallback,
                    fallbackMessage,
                    alternativeVideos: updatedAlternatives
                }
            })
            .where(eq(chaptersTable.chapterId, chapterId));

        return NextResponse.json({ success: true, message: "Video updated successfully" });

    } catch (e: any) {
        console.error("PATCH /api/course error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
