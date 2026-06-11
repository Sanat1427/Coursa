import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revisionScheduleTable, courseTable, chaptersTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const upcoming = await db.select({
            id: revisionScheduleTable.id,
            courseId: revisionScheduleTable.courseId,
            chapterId: revisionScheduleTable.chapterId,
            reviewNumber: revisionScheduleTable.reviewNumber,
            scheduledAt: revisionScheduleTable.scheduledAt,
            status: revisionScheduleTable.status,
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
                gt(revisionScheduleTable.scheduledAt, new Date())
            )
        )
        .orderBy(revisionScheduleTable.scheduledAt)
        .limit(20);

        return NextResponse.json(upcoming);
    } catch (e: any) {
        console.error("GET /api/revision/upcoming error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
