import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revisionScheduleTable, courseTable, chaptersTable, revisionQuestionsTable, memoryStrengthTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, lte } from "drizzle-orm";
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

        // 3. Populate with questions and memory scores
        const populated = await Promise.all(reviews.map(async (rev) => {
            const [questions, memStrength] = await Promise.all([
                db.select().from(revisionQuestionsTable).where(eq(revisionQuestionsTable.chapterId, rev.chapterId)),
                db.select().from(memoryStrengthTable).where(
                    and(
                        eq(memoryStrengthTable.userId, safeUserEmail),
                        eq(memoryStrengthTable.chapterId, rev.chapterId)
                    )
                ).limit(1)
            ]);

            return {
                ...rev,
                questions,
                memoryScore: memStrength[0]?.score ?? 50
            };
        }));

        return NextResponse.json(populated);
    } catch (e: any) {
        console.error("GET /api/revision/today error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
