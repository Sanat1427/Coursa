import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlistFlashcardsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const courseId = req.nextUrl.searchParams.get("courseId");
        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const flashcards = await db.select().from(playlistFlashcardsTable).where(eq(playlistFlashcardsTable.courseId, courseId));
        return NextResponse.json(flashcards);
    } catch (e: any) {
        console.error("GET /api/playlist/flashcards error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { flashcardId, rating } = await req.json(); // rating: 'EASY' | 'MEDIUM' | 'HARD'
        if (!flashcardId || !rating) {
            return NextResponse.json({ error: "Missing flashcardId or rating" }, { status: 400 });
        }

        const cards = await db.select().from(playlistFlashcardsTable).where(eq(playlistFlashcardsTable.id, flashcardId)).limit(1);
        if (cards.length === 0) {
            return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
        }

        const card = cards[0];
        let currentBox = card.box || 1;
        let nextBox = currentBox;
        let days = 1;

        if (rating === 'EASY') {
            nextBox = Math.min(5, currentBox + 1);
            days = nextBox * 3;
        } else if (rating === 'MEDIUM') {
            days = nextBox * 2;
        } else { // HARD
            nextBox = 1;
            days = 1;
        }

        const nextReviewDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        await db.update(playlistFlashcardsTable)
            .set({
                box: nextBox,
                reviewSchedule: nextReviewDate
            })
            .where(eq(playlistFlashcardsTable.id, flashcardId));

        return NextResponse.json({ success: true, nextReviewDate, box: nextBox });
    } catch (e: any) {
        console.error("POST /api/playlist/flashcards error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
