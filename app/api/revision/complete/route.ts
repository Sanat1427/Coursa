import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { RetentionService } from "@/lib/retentionService";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chapterId, scheduleId, rating } = await req.json();

        if (!chapterId || !scheduleId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (rating !== 'EASY' && rating !== 'MEDIUM' && rating !== 'HARD') {
            return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
        }

        const result = await RetentionService.completeReview(
            safeUserEmail,
            chapterId,
            parseInt(scheduleId, 10) || scheduleId,
            rating
        );

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("POST /api/revision/complete error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
