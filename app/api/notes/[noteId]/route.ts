import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notesTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

interface RouteProps {
    params: Promise<{
        noteId: string;
    }>;
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
    try {
        const { noteId } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, tags } = await req.json();

        // Verify ownership
        const note = await db.select().from(notesTable)
            .where(
                and(
                    eq(notesTable.noteId, noteId),
                    eq(notesTable.userId, safeUserEmail)
                )
            )
            .limit(1);

        if (note.length === 0) {
            return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
        }

        const formattedTags = Array.isArray(tags) 
            ? tags.map(t => String(t).trim()).filter(t => t.length > 0)
            : [];

        const [updatedNote] = await db.update(notesTable)
            .set({
                content: content ?? "",
                tags: formattedTags,
                updatedAt: new Date(),
            })
            .where(eq(notesTable.noteId, noteId))
            .returning();

        return NextResponse.json(updatedNote);
    } catch (error: any) {
        console.error("PUT /api/notes/[noteId] error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
    try {
        const { noteId } = await params;
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership
        const note = await db.select().from(notesTable)
            .where(
                and(
                    eq(notesTable.noteId, noteId),
                    eq(notesTable.userId, safeUserEmail)
                )
            )
            .limit(1);

        if (note.length === 0) {
            return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
        }

        await db.delete(notesTable).where(eq(notesTable.noteId, noteId));

        return NextResponse.json({ success: true, message: "Note deleted successfully" });
    } catch (error: any) {
        console.error("DELETE /api/notes/[noteId] error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
