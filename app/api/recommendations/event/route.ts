import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendationEventsTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { recommendedCourseId, eventType } = await req.json();

        if (!recommendedCourseId || !eventType) {
            return NextResponse.json({ error: "Missing recommendedCourseId or eventType" }, { status: 400 });
        }

        if (!["VIEWED", "CLICKED", "ENROLLED"].includes(eventType)) {
            return NextResponse.json({ error: "Invalid eventType value" }, { status: 400 });
        }

        // Prevent duplicate recommendation tracking requests (same user, course, and eventType)
        const existingEvent = await db.select().from(recommendationEventsTable)
            .where(
                and(
                    eq(recommendationEventsTable.userId, safeUserEmail),
                    eq(recommendationEventsTable.recommendedCourseId, recommendedCourseId),
                    eq(recommendationEventsTable.eventType, eventType)
                )
            )
            .limit(1);

        if (existingEvent.length > 0) {
            return NextResponse.json({ success: true, event: existingEvent[0], message: "Duplicate event skipped" });
        }

        const loggedEvent = await db.insert(recommendationEventsTable).values({
            userId: safeUserEmail,
            recommendedCourseId,
            eventType,
            clickedAt: new Date()
        }).returning();

        try {
            revalidateTag("recommendations", "max");
        } catch (err) {
            console.warn("revalidateTag failed in POST /api/recommendations/event:", err);
        }

        return NextResponse.json({ success: true, event: loggedEvent[0] });
    } catch (e: any) {
        console.error("POST /api/recommendations/event error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
