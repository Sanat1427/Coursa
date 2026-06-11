import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarksTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

interface RouteProps {
    params: Promise<{
        bookmarkId: string;
    }>;
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
    try {
        const { bookmarkId } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership
        const bookmark = await db.select().from(bookmarksTable)
            .where(
                and(
                    eq(bookmarksTable.bookmarkId, bookmarkId),
                    eq(bookmarksTable.userId, safeUserEmail)
                )
            )
            .limit(1);

        if (bookmark.length === 0) {
            return NextResponse.json({ error: "Bookmark not found or unauthorized" }, { status: 404 });
        }

        await db.delete(bookmarksTable).where(eq(bookmarksTable.bookmarkId, bookmarkId));

        return NextResponse.json({ success: true, message: "Bookmark deleted successfully" });
    } catch (error: any) {
        console.error("DELETE /api/bookmarks/[bookmarkId] error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
