import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revisionScheduleTable, courseTable, chaptersTable, revisionQuestionsTable, memoryStrengthTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, lte, inArray } from "drizzle-orm";
import { RetentionService } from "@/lib/retentionService";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Process overdue pending schedules (mark missed & penalty)
        await RetentionService.updateOverdueReviews(safeUserEmail);

        // 2. Fetch pending reviews due today or earlier (overdue)
        const reviews = await db.select({
            id: revisionScheduleTable.id,
            courseId: revisionScheduleTable.courseId,
            chapterId: revisionScheduleTable.chapterId,
            reviewNumber: revisionScheduleTable.reviewNumber,
            scheduledAt: revisionScheduleTable.scheduledAt,
            status: revisionScheduleTable.status,
            easeFactor: revisionScheduleTable.easeFactor,
            courseName: courseTable.courseName,
            chapterTitle: chaptersTable.chapterTitle,
        })
        .from(revisionScheduleTable)
        .innerJoin(courseTable, eq(revisionScheduleTable.courseId, courseTable.courseId))
        .innerJoin(chaptersTable, eq(revisionScheduleTable.chapterId, chaptersTable.chapterId))
        .where(
            and(
                eq(revisionScheduleTable.userId, safeUserEmail),
                eq(revisionScheduleTable.status, "PENDING"),
                lte(revisionScheduleTable.scheduledAt, new Date())
            )
        )
        .orderBy(revisionScheduleTable.scheduledAt);

        // 3. Populate with questions and memory scores in batch (Eliminating N+1 queries)
        const chapterIds = reviews.map(r => r.chapterId);
        
        let allQuestions: any[] = [];
        let allMemoryStrengths: any[] = [];
        
        if (chapterIds.length > 0) {
            [allQuestions, allMemoryStrengths] = await Promise.all([
                db.select().from(revisionQuestionsTable).where(inArray(revisionQuestionsTable.chapterId, chapterIds)),
                db.select().from(memoryStrengthTable).where(
                    and(
                        eq(memoryStrengthTable.userId, safeUserEmail),
                        inArray(memoryStrengthTable.chapterId, chapterIds)
                    )
                )
            ]);
        }

        const questionsMap = new Map<string, any[]>();
        allQuestions.forEach(q => {
            const list = questionsMap.get(q.chapterId) || [];
            list.push(q);
            questionsMap.set(q.chapterId, list);
        });

        const memoryMap = new Map<string, number>();
        allMemoryStrengths.forEach(m => {
            memoryMap.set(m.chapterId, m.score);
        });

        const populated = reviews.map(rev => ({
            ...rev,
            questions: questionsMap.get(rev.chapterId) || [],
            memoryScore: memoryMap.get(rev.chapterId) ?? 50
        }));

        return NextResponse.json(populated);
    } catch (e: any) {
        console.error("GET /api/revision/today error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}

