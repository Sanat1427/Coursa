import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseTable, quizAttemptsTable, quizzesTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

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

        // Fetch user attempts joined with quiz details and course name
        const history = await db.select({
            attemptId: quizAttemptsTable.attemptId,
            score: quizAttemptsTable.score,
            totalQuestions: quizAttemptsTable.totalQuestions,
            percentage: quizAttemptsTable.percentage,
            createdAt: quizAttemptsTable.createdAt,
            quizTitle: quizzesTable.title,
            courseName: courseTable.courseName,
            courseId: courseTable.courseId,
        })
        .from(quizAttemptsTable)
        .innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.quizId))
        .innerJoin(courseTable, eq(quizzesTable.courseId, courseTable.courseId))
        .where(eq(quizAttemptsTable.userId, safeUserEmail))
        .orderBy(desc(quizAttemptsTable.createdAt));

        return NextResponse.json(history);
    } catch (error: any) {
        console.error("GET /api/quiz/history error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
