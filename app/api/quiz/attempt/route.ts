import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionsTable, quizAnswersTable, quizAttemptsTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
        }

        const { quizId, answers } = await req.json(); // answers: Array<{ questionId: string, selectedAnswer: string }>

        if (!quizId || !Array.isArray(answers)) {
            return NextResponse.json({ error: "Missing quizId or answers array" }, { status: 400 });
        }

        // Fetch all questions for this quiz to grade
        const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId));
        if (questions.length === 0) {
            return NextResponse.json({ error: "No questions found for this quiz" }, { status: 404 });
        }

        let score = 0;
        const gradedAnswers = questions.map((question) => {
            const userAns = answers.find((a) => a.questionId === question.questionId);
            const selectedAnswer = userAns ? userAns.selectedAnswer || "" : "";
            
            // Compare answers (trim and case-insensitive check)
            const isCorrect = selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
            if (isCorrect) {
                score += 1;
            }

            return {
                questionId: question.questionId,
                selectedAnswer,
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            };
        });

        const totalQuestions = questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);
        const attemptId = crypto.randomUUID();

        // Transactionally insert attempts and answers
        const attemptResult = await db.transaction(async (tx) => {
            const [insertedAttempt] = await tx.insert(quizAttemptsTable).values({
                attemptId,
                quizId,
                userId: safeUserEmail,
                score,
                totalQuestions,
                percentage,
                createdAt: new Date(),
            }).returning();

            for (const ans of gradedAnswers) {
                await tx.insert(quizAnswersTable).values({
                    attemptId,
                    questionId: ans.questionId,
                    selectedAnswer: ans.selectedAnswer,
                    isCorrect: ans.isCorrect,
                    createdAt: new Date(),
                });
            }

            return insertedAttempt;
        });

        return NextResponse.json({
            ...attemptResult,
            gradedAnswers
        });
    } catch (error: any) {
        console.error("POST /api/quiz/attempt error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

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

        const quizId = req.nextUrl.searchParams.get("quizId");
        if (!quizId) {
            return NextResponse.json({ error: "Missing quizId parameter" }, { status: 400 });
        }

        // Fetch all attempts for the user on this quiz, ordered by latest
        const attempts = await db.select().from(quizAttemptsTable)
            .where(
                and(
                    eq(quizAttemptsTable.userId, safeUserEmail),
                    eq(quizAttemptsTable.quizId, quizId)
                )
            )
            .orderBy(desc(quizAttemptsTable.createdAt));

        const totalAttempts = attempts.length;
        const highestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0;
        const latestScore = totalAttempts > 0 ? attempts[0].percentage : 0;

        return NextResponse.json({
            totalAttempts,
            highestScore,
            latestScore,
            attempts
        });
    } catch (error: any) {
        console.error("GET /api/quiz/attempt error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
