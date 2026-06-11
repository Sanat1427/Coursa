import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseTable, userProgressTable, quizAttemptsTable, quizzesTable, notesTable, chaptersTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc, and, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import moment from "moment";

// Core aggregation function
async function fetchAnalyticsData(userId: string) {
    // 1. Fetch user courses
    const userCourses = await db.select().from(courseTable)
        .where(eq(courseTable.userId, userId))
        .orderBy(desc(courseTable.createdAt));

    // 2. Fetch user progress
    const progress = await db.select().from(userProgressTable)
        .where(eq(userProgressTable.userId, userId));

    // 3. Fetch quiz attempts joined with quiz title
    const attempts = await db.select({
        attemptId: quizAttemptsTable.attemptId,
        score: quizAttemptsTable.score,
        totalQuestions: quizAttemptsTable.totalQuestions,
        percentage: quizAttemptsTable.percentage,
        createdAt: quizAttemptsTable.createdAt,
        quizTitle: quizzesTable.title,
    })
    .from(quizAttemptsTable)
    .innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.quizId))
    .where(eq(quizAttemptsTable.userId, userId))
    .orderBy(desc(quizAttemptsTable.createdAt));

    // 4. Fetch notes updates
    const notes = await db.select().from(notesTable)
        .where(eq(notesTable.userId, userId));

    // Calculate User Analytics
    const totalCourses = userCourses.length;
    const totalChaptersCompleted = progress.filter(p => p.status === 'COMPLETED').length;

    let completedCourses = 0;
    let activeCourses = 0;
    const courseProgressList = userCourses.map(course => {
        const courseChapters = (course.courseLayout as any)?.chapters || [];
        const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
        
        const completedForCourse = progress.filter(p => p.courseId === course.courseId && p.status === 'COMPLETED').length;
        const progressPercentage = totalChapters > 0 ? Math.round((completedForCourse / totalChapters) * 100) : 0;
        
        if (progressPercentage >= 100) {
            completedCourses += 1;
        } else if (progressPercentage > 0) {
            activeCourses += 1;
        }
        
        return {
            courseId: course.courseId,
            courseName: course.courseName,
            progressPercentage,
        };
    });

    // Calculate Quiz Analytics
    const totalQuizzesAttempted = attempts.length;
    const highestQuizScore = totalQuizzesAttempted > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0;
    const avgQuizScore = totalQuizzesAttempted > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzesAttempted)
        : 0;

    // Calculate Leaderboard (Most Viewed Chapters)
    const topViews = [...progress]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    const topChapterIds = topViews.map(v => v.chapterId);
    let topChapters: any[] = [];
    if (topChapterIds.length > 0) {
        const chaptersList = await db.select({
            chapterId: chaptersTable.chapterId,
            chapterTitle: chaptersTable.chapterTitle
        })
        .from(chaptersTable)
        .where(inArray(chaptersTable.chapterId, topChapterIds));

        const chapterTitleMap = new Map(chaptersList.map(c => [c.chapterId, c.chapterTitle]));
        
        topChapters = topViews.map(p => ({
            chapterId: p.chapterId,
            chapterTitle: chapterTitleMap.get(p.chapterId) || "Unknown Lesson",
            views: p.views,
            status: p.status,
        }));
    }

    // Calculate Activity Aggregations (Completions + Quizzes + Notes Updates)
    const dailyActivity = [];
    const weeklyActivity = [];
    const monthlyActivity = [];

    // Daily: Last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').startOf('day');
        const formattedDate = date.format('ddd');

        const completionsCount = progress.filter(p => p.status === 'COMPLETED' && p.completedAt && moment(p.completedAt).isSame(date, 'day')).length;
        const quizzesCount = attempts.filter(a => moment(a.createdAt).isSame(date, 'day')).length;
        const notesCount = notes.filter(n => moment(n.updatedAt).isSame(date, 'day')).length;

        dailyActivity.push({
            name: formattedDate,
            completions: completionsCount,
            quizzes: quizzesCount,
            notes: notesCount,
        });
    }

    // Weekly: Last 4 weeks
    for (let i = 3; i >= 0; i--) {
        const startOfWeek = moment().subtract(i, 'weeks').startOf('week');
        const endOfWeek = moment().subtract(i, 'weeks').endOf('week');
        const label = i === 0 ? "This Week" : `${i}w ago`;

        const completionsCount = progress.filter(p => p.status === 'COMPLETED' && p.completedAt && moment(p.completedAt).isBetween(startOfWeek, endOfWeek)).length;
        const quizzesCount = attempts.filter(a => moment(a.createdAt).isBetween(startOfWeek, endOfWeek)).length;
        const notesCount = notes.filter(n => moment(n.updatedAt).isBetween(startOfWeek, endOfWeek)).length;

        weeklyActivity.push({
            name: label,
            completions: completionsCount,
            quizzes: quizzesCount,
            notes: notesCount,
        });
    }

    // Monthly: Last 6 months
    for (let i = 5; i >= 0; i--) {
        const startOfMonth = moment().subtract(i, 'months').startOf('month');
        const endOfMonth = moment().subtract(i, 'months').endOf('month');
        const label = startOfMonth.format('MMM');

        const completionsCount = progress.filter(p => p.status === 'COMPLETED' && p.completedAt && moment(p.completedAt).isBetween(startOfMonth, endOfMonth)).length;
        const quizzesCount = attempts.filter(a => moment(a.createdAt).isBetween(startOfMonth, endOfMonth)).length;
        const notesCount = notes.filter(n => moment(n.updatedAt).isBetween(startOfMonth, endOfMonth)).length;

        monthlyActivity.push({
            name: label,
            completions: completionsCount,
            quizzes: quizzesCount,
            notes: notesCount,
        });
    }

    return {
        userStats: {
            totalCourses,
            completedCourses,
            activeCourses,
            totalChaptersCompleted,
        },
        quizStats: {
            totalQuizzesAttempted,
            highestQuizScore,
            avgQuizScore,
            quizTrends: [...attempts].reverse(), // Chronological quiz attempt percentages
        },
        courseProgress: courseProgressList,
        topChapters,
        dailyActivity,
        weeklyActivity,
        monthlyActivity,
    };
}

// Wrap inside Next.js unstable_cache
const getCachedAnalytics = unstable_cache(
    async (userId: string) => {
        return fetchAnalyticsData(userId);
    },
    ["user-analytics"],
    {
        revalidate: 60, // Cache for 60 seconds
        tags: ["analytics"]
    }
);

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user requests bypass cache (e.g. force reload)
        const bypassCache = req.nextUrl.searchParams.get("refresh") === "true";
        
        let data;
        if (bypassCache) {
            data = await fetchAnalyticsData(safeUserEmail);
        } else {
            data = await getCachedAnalytics(safeUserEmail);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/analytics error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
