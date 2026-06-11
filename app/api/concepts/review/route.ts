import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conceptMasteryTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

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

        const { conceptId, rating } = await req.json();

        if (!conceptId || !rating) {
            return NextResponse.json({ error: "Missing conceptId or rating" }, { status: 400 });
        }

        if (rating !== "EASY" && rating !== "MEDIUM" && rating !== "HARD") {
            return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
        }

        // Fetch existing concept mastery
        const existingMastery = await db.select().from(conceptMasteryTable)
            .where(
                and(
                    eq(conceptMasteryTable.userId, safeUserEmail),
                    eq(conceptMasteryTable.conceptId, conceptId)
                )
            )
            .limit(1);

        let currentScore = existingMastery.length > 0 ? existingMastery[0].masteryScore : 0;
        let newScore = currentScore;

        if (rating === "EASY") {
            newScore = Math.min(100, currentScore + 20);
        } else if (rating === "MEDIUM") {
            newScore = Math.min(100, currentScore + 10);
        } else { // HARD
            newScore = Math.max(0, currentScore - 15);
        }

        let result;
        if (existingMastery.length > 0) {
            const updated = await db.update(conceptMasteryTable)
                .set({
                    masteryScore: newScore,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(conceptMasteryTable.id, existingMastery[0].id))
                .returning();
            result = updated[0];
        } else {
            const inserted = await db.insert(conceptMasteryTable)
                .values({
                    userId: safeUserEmail,
                    conceptId,
                    masteryScore: newScore,
                    lastReviewedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
                .returning();
            result = inserted[0];
        }

        let status = "Locked";
        if (newScore >= 70) {
            status = "Mastered";
        } else if (newScore > 0) {
            status = "Needs Review";
        } else {
            status = "Ready to Learn";
        }

        try {
            revalidateTag("readiness", "max");
        } catch (err) {
            console.warn("revalidateTag failed in POST /api/concepts/review:", err);
        }

        return NextResponse.json({
            success: true,
            conceptId,
            masteryScore: newScore,
            status
        });

    } catch (error: any) {
        console.error("POST /api/concepts/review error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
