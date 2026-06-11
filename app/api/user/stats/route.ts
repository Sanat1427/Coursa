import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseTable, userProgressTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

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

        // Fetch all courses owned by the user
        const userCourses = await db.select().from(courseTable)
            .where(eq(courseTable.userId, safeUserEmail));

        // Fetch all progress records for the user
        const allProgress = await db.select().from(userProgressTable)
            .where(eq(userProgressTable.userId, safeUserEmail));

        // Count total completed chapters
        const completedChapters = allProgress.filter(p => p.status === 'COMPLETED');
        const totalChaptersCompleted = completedChapters.length;

        // Calculate total completed courses
        let totalCoursesCompleted = 0;
        for (const course of userCourses) {
            const courseChapters = (course.courseLayout as any)?.chapters || [];
            const expectedTotal = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
            
            if (expectedTotal > 0) {
                // Check if all chapters in this course are completed
                const completedForCourse = completedChapters.filter(p => p.courseId === course.courseId);
                if (completedForCourse.length >= expectedTotal) {
                    totalCoursesCompleted += 1;
                }
            }
        }

        const totalCoursesStarted = userCourses.length;

        return NextResponse.json({
            totalCoursesStarted,
            totalCoursesCompleted,
            totalChaptersCompleted
        });
    } catch (error: any) {
        console.error("GET /api/user/stats error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
