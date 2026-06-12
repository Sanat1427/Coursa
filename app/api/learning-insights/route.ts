import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseTable, userProgressTable, chaptersTable } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
// TODO: Re-enable in future release
// import { RetentionService } from "@/lib/retentionService";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Re-enable in future release
        // const readiness = await RetentionService.getConceptReadiness(safeUserEmail);

        // Fetch user courses, progress, and chapters
        const userCourses = await db.select().from(courseTable).where(eq(courseTable.userId, safeUserEmail));
        const courseIds = userCourses.map(c => c.courseId);

        let allProgress: any[] = [];
        let allChapters: any[] = [];

        if (courseIds.length > 0) {
            [allProgress, allChapters] = await Promise.all([
                db.select().from(userProgressTable).where(eq(userProgressTable.userId, safeUserEmail)),
                db.select().from(chaptersTable).where(inArray(chaptersTable.courseId, courseIds))
            ]);
        }

        const activeCourses = userCourses.map(course => {
            const courseChapters = (course.courseLayout as any)?.chapters || [];
            const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
            
            const completedForCourse = allProgress.filter(
                p => p.courseId === course.courseId && p.status === 'COMPLETED'
            );
            
            const progressPercentage = totalChapters > 0 
                ? Math.round((completedForCourse.length / totalChapters) * 100) 
                : 0;

            // Find chapters in DB for this course
            const dbChapters = allChapters.filter(ch => ch.courseId === course.courseId);

            // Find first incomplete chapter from layout
            const completedIds = new Set(completedForCourse.map(p => p.chapterId));
            const firstIncompleteLayoutCh = courseChapters.find((ch: any) => !completedIds.has(ch.chapterId || ch.id));
            
            let currentChapterName = "Introduction";
            let currentChapterId = "";
            if (firstIncompleteLayoutCh) {
                currentChapterId = firstIncompleteLayoutCh.chapterId || firstIncompleteLayoutCh.id || "";
                const matchedDbCh = dbChapters.find(ch => ch.chapterId === currentChapterId);
                currentChapterName = matchedDbCh?.chapterTitle || firstIncompleteLayoutCh.chapterTitle || firstIncompleteLayoutCh.name || "Untitled Chapter";
            } else if (dbChapters.length > 0) {
                currentChapterName = dbChapters[0].chapterTitle;
                currentChapterId = dbChapters[0].chapterId;
            }

            let nextReviewStr = "None scheduled";
            
            return {
                courseId: course.courseId,
                courseName: course.courseName,
                description: (course.courseLayout as any)?.courseDescription || "",
                progressPercentage,
                totalChapters,
                completedChapters: completedForCourse.length,
                currentChapterName,
                currentChapterId,
                nextReview: nextReviewStr
            };
        }).filter(c => c.progressPercentage < 100); // Only show in-progress courses

        // Dynamic recent activity logs based on user progress & reviews
        const recentActivity = allProgress
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map(p => {
                const matchedCourse = userCourses.find(c => c.courseId === p.courseId);
                return {
                    id: p.id,
                    chapterId: p.chapterId,
                    courseName: matchedCourse?.courseName || "AI Course",
                    status: p.status,
                    timestamp: p.updatedAt
                };
            });

        return NextResponse.json({
            metrics: { totalConcepts: 0, masteredConcepts: 0, coveragePercentage: 0, pendingReviews: 0, streakDays: 3 },
            activeCourses,
            categoryCoverage: [],
            weakConcepts: [],
            strongConcepts: [],
            recentActivity
        });

    } catch (e: any) {
        console.error("GET /api/learning-insights error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
