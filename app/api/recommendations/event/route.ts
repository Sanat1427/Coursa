import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommendationEventsTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";

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

        const loggedEvent = await db.insert(recommendationEventsTable).values({
            userId: safeUserEmail,
            recommendedCourseId,
            eventType,
            clickedAt: new Date()
        }).returning();

        return NextResponse.json({ success: true, event: loggedEvent[0] });
    } catch (e: any) {
        console.error("POST /api/recommendations/event error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
