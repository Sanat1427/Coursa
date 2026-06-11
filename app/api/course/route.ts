import { db } from "@/lib/db";
import { chaptersTable, courseTable, userProgressTable, quizzesTable, questionsTable, quizAttemptsTable, quizAnswersTable, notesTable, bookmarksTable } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');
        const user = await currentUser();

        if (!courseId) {
            const usercourses = await db.select().from(courseTable)
                .where(eq(courseTable.userId, user?.primaryEmailAddress?.emailAddress as string)).orderBy(courseTable.createdAt);
            
            const courseIds = usercourses.map(c => c.courseId);
            if (courseIds.length > 0) {
                const allProgress = await db.select().from(userProgressTable)
                    .where(
                        and(
                            eq(userProgressTable.userId, user?.primaryEmailAddress?.emailAddress as string),
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


        const userId = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        console.error("Internal Server Error: ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

        // 2. Cascade Delete: Start with slides which depend on chapters
        await db.delete(chapterContentSlidesTable)
            .where(eq(chapterContentSlidesTable.courseId, courseId));

        // 3. Delete chapters which depend on course
        await db.delete(chaptersTable)
            .where(eq(chaptersTable.courseId, courseId));

        // 3.5. Delete progress records which depend on course
        await db.delete(userProgressTable)
            .where(eq(userProgressTable.courseId, courseId));

        // 3.8. Delete quiz tables cascade
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

        // 3.9. Delete notes and bookmarks cascade
        await db.delete(notesTable).where(eq(notesTable.courseId, courseId));
        await db.delete(bookmarksTable).where(eq(bookmarksTable.courseId, courseId));

        // 4. Delete the main course record
        await db.delete(courseTable)
            .where(eq(courseTable.courseId, courseId));

        return NextResponse.json({ success: true, message: "Course deleted successfully" });
    } catch (e: any) {
        console.error("Internal Server Error (DELETE): ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
