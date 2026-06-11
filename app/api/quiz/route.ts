import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionsTable, quizzesTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chapterId = req.nextUrl.searchParams.get("chapterId");
        if (!chapterId) {
            return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
        }

        const quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.chapterId, chapterId));
        
        // Fetch questions for each quiz
        const quizzesWithQuestions = await Promise.all(
            quizzes.map(async (quiz) => {
                const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quiz.quizId));
                return {
                    ...quiz,
                    questions
                };
            })
        );

        return NextResponse.json(quizzesWithQuestions);
    } catch (error: any) {
        console.error("GET /api/quiz error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId, chapterId, chapterTitle, subContent } = await req.json();

        if (!courseId || !chapterId || !chapterTitle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate Quiz using Gemini
        const systemPrompt = `You are an expert educational assessment creator.
Your task is to generate a JSON formatted quiz with exactly 5 questions based on the provided chapter content.

Chapter Title: ${chapterTitle}
Key Topics: ${JSON.stringify(subContent || [])}

You must return ONLY a JSON object with this exact structure:
{
  "title": "A short, engaging title for the quiz",
  "description": "A brief description of what this quiz tests",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "questionText": "Clear, concise question statement",
      "options": ["Option A", "Option B", "Option C", "Option D"], 
      "correctAnswer": "The exact string matching the correct option",
      "explanation": "A short, helpful explanation of why this is correct"
    },
    {
      "type": "TRUE_FALSE",
      "questionText": "Clear, concise true or false question statement",
      "options": null,
      "correctAnswer": "True" or "False",
      "explanation": "A short, helpful explanation of why this is correct"
    }
  ]
}

Ensure the questions are accurate, directly related to the key topics, and offer constructive explanations. Return ONLY the raw JSON object, no markdown wrappers, no explanations outside JSON.`;

        const resp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const rawResult = resp.text || '';
        const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonResult = JSON.parse(sanitizedResult);

        const quizId = crypto.randomUUID();

        // Save to DB in a Transaction
        const quizData = await db.transaction(async (tx) => {
            const [insertedQuiz] = await tx.insert(quizzesTable).values({
                quizId,
                courseId,
                chapterId,
                title: jsonResult.title || `Quiz for ${chapterTitle}`,
                description: jsonResult.description || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            const questions = [];
            for (const q of (jsonResult.questions || [])) {
                const questionId = crypto.randomUUID();
                const [insertedQuestion] = await tx.insert(questionsTable).values({
                    questionId,
                    quizId,
                    type: q.type || 'MULTIPLE_CHOICE',
                    questionText: q.questionText || '',
                    options: q.options || null,
                    correctAnswer: q.correctAnswer || '',
                    explanation: q.explanation || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning();
                questions.push(insertedQuestion);
            }

            return {
                ...insertedQuiz,
                questions
            };
        });

        return NextResponse.json(quizData);
    } catch (error: any) {
        console.error("POST /api/quiz error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
