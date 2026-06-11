import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarksTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const chapterId = req.nextUrl.searchParams.get("chapterId");
        if (!chapterId) {
            return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
        }

        const bookmarks = await db.select()
            .from(bookmarksTable)
            .where(
                and(
                    eq(bookmarksTable.userId, safeUserEmail),
                    eq(bookmarksTable.chapterId, chapterId)
                )
            )
            .orderBy(desc(bookmarksTable.timestamp)); // Order by timestamp (descending or ascending? ascending is better for viewing in video timeline order!)
            
        // Sorting ascending is better for video timestamps
        const sortedBookmarks = [...bookmarks].sort((a, b) => a.timestamp - b.timestamp);

        return NextResponse.json(sortedBookmarks);
    } catch (error: any) {
        console.error("GET /api/bookmarks error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

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

        const { courseId, chapterId, timestamp, note } = await req.json();

        if (!courseId || !chapterId || typeof timestamp !== 'number') {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const bookmarkId = crypto.randomUUID();
        const [insertedBookmark] = await db.insert(bookmarksTable)
            .values({
                bookmarkId,
                userId: safeUserEmail,
                courseId,
                chapterId,
                timestamp: Math.max(0, Math.floor(timestamp)),
                note: note || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(insertedBookmark);
    } catch (error: any) {
        console.error("POST /api/bookmarks error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
