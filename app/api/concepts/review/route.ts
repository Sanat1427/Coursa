import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conceptMasteryTable } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
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

        const { conceptId, conceptIds, rating } = await req.json();

        if (!rating) {
            return NextResponse.json({ error: "Missing rating" }, { status: 400 });
        }

        if (rating !== "EASY" && rating !== "MEDIUM" && rating !== "HARD") {
            return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
        }

        const idsToProcess: string[] = conceptIds && Array.isArray(conceptIds)
            ? conceptIds
            : conceptId
                ? [conceptId]
                : [];

        if (idsToProcess.length === 0) {
            return NextResponse.json({ error: "Missing conceptId or conceptIds" }, { status: 400 });
        }

        // Fetch existing concept masteries in a single query
        const existingMasteries = await db.select().from(conceptMasteryTable)
            .where(
                and(
                    eq(conceptMasteryTable.userId, safeUserEmail),
                    inArray(conceptMasteryTable.conceptId, idsToProcess)
                )
            );

        const masteryMap = new Map(existingMasteries.map(m => [m.conceptId, m]));
        const results = [];

        for (const cid of idsToProcess) {
            const existing = masteryMap.get(cid);
            let currentScore = existing ? existing.masteryScore : 40; // Default score is 40
            let newScore = currentScore;

            if (rating === "EASY") {
                newScore = Math.min(100, currentScore + 20);
            } else if (rating === "MEDIUM") {
                newScore = Math.min(100, currentScore + 10);
            } else { // HARD
                newScore = Math.max(0, currentScore - 15);
            }

            let resultRow;
            if (existing) {
                const updated = await db.update(conceptMasteryTable)
                    .set({
                        masteryScore: newScore,
                        lastReviewedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(conceptMasteryTable.id, existing.id))
                    .returning();
                resultRow = updated[0];
            } else {
                const inserted = await db.insert(conceptMasteryTable)
                    .values({
                        userId: safeUserEmail,
                        conceptId: cid,
                        masteryScore: newScore,
                        lastReviewedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                    .returning();
                resultRow = inserted[0];
            }

            let status = "Locked";
            if (newScore >= 70) {
                status = "Mastered";
            } else if (newScore > 0) {
                status = "Needs Review";
            } else {
                status = "Ready to Learn";
            }

            results.push({
                conceptId: cid,
                masteryScore: newScore,
                status
            });
        }

        try {
            revalidateTag("readiness", "max");
        } catch (err) {
            console.warn("revalidateTag failed in POST /api/concepts/review:", err);
        }

        return NextResponse.json({
            success: true,
            reviews: results
        });

    } catch (error: any) {
        console.error("POST /api/concepts/review error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

