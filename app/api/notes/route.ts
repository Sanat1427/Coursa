import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notesTable, courseTable, chaptersTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, ilike, sql } from "drizzle-orm";

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

        const courseId = req.nextUrl.searchParams.get("courseId");
        const chapterId = req.nextUrl.searchParams.get("chapterId");
        const search = req.nextUrl.searchParams.get("search");
        const tag = req.nextUrl.searchParams.get("tag");

        // Base query conditions
        const conditions = [eq(notesTable.userId, safeUserEmail)];

        if (courseId) {
            conditions.push(eq(notesTable.courseId, courseId));
        }
        if (chapterId) {
            conditions.push(eq(notesTable.chapterId, chapterId));
        }
        if (search) {
            conditions.push(ilike(notesTable.content, `%${search}%`));
        }
        if (tag) {
            // Check if JSON tags array contains the specified tag
            conditions.push(sql`${notesTable.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`);
        }

        const notes = await db.select({
            id: notesTable.id,
            noteId: notesTable.noteId,
            courseId: notesTable.courseId,
            chapterId: notesTable.chapterId,
            content: notesTable.content,
            tags: notesTable.tags,
            createdAt: notesTable.createdAt,
            updatedAt: notesTable.updatedAt,
            courseName: courseTable.courseName,
            chapterTitle: chaptersTable.chapterTitle,
        })
        .from(notesTable)
        .innerJoin(courseTable, eq(notesTable.courseId, courseTable.courseId))
        .innerJoin(chaptersTable, eq(notesTable.chapterId, chaptersTable.chapterId))
        .where(and(...conditions));

        return NextResponse.json(notes);
    } catch (error: any) {
        console.error("GET /api/notes error:", error);
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

        const { courseId, chapterId, content, tags } = await req.json();

        if (!courseId || !chapterId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Clean up or format tags (ensure they are strings and trimmed)
        const formattedTags = Array.isArray(tags) 
            ? tags.map(t => String(t).trim()).filter(t => t.length > 0)
            : [];

        // Check if note already exists for this user, course, and chapter
        const existingNotes = await db.select()
            .from(notesTable)
            .where(
                and(
                    eq(notesTable.userId, safeUserEmail),
                    eq(notesTable.courseId, courseId),
                    eq(notesTable.chapterId, chapterId)
                )
            )
            .limit(1);

        if (existingNotes.length > 0) {
            // Upsert / Update behavior for ease of autosave
            const existing = existingNotes[0];
            const [updatedNote] = await db.update(notesTable)
                .set({
                    content: content ?? "",
                    tags: formattedTags,
                    updatedAt: new Date(),
                })
                .where(eq(notesTable.noteId, existing.noteId))
                .returning();
            
            return NextResponse.json(updatedNote);
        }

        // Insert new note
        const noteId = crypto.randomUUID();
        const [insertedNote] = await db.insert(notesTable)
            .values({
                noteId,
                userId: safeUserEmail,
                courseId,
                chapterId,
                content: content ?? "",
                tags: formattedTags,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(insertedNote);
    } catch (error: any) {
        console.error("POST /api/notes error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
