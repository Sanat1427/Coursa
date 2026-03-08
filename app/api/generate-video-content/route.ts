import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { chaptersTable, courseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, ilike } from "drizzle-orm";
import { inngest } from "@/config/inngest";

export const maxDuration = 60; // Allow maximum 60 seconds execution time on Vercel

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { chapter, courseId } = await req.json();

        // verify ownership
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        const courseRow = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
        if (courseRow.length === 0 || courseRow[0].userId !== safeUserEmail) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Supabase DB Cache: Check if same chapter title already has generated content
        const existingChapters = await db.select().from(chaptersTable)
            .where(ilike(chaptersTable.chapterTitle, chapter.chapterTitle))
            .limit(1);

        if (existingChapters.length > 0 && existingChapters[0].youtubeVideoId) {
            console.log("[CACHE HIT] Using existing YouTube video for chapter:", chapter.chapterTitle);
            const cachedChapter = existingChapters[0];
            const newChapterId = `${courseId}-${chapter.chapterId}`;

            await db.insert(chaptersTable).values({
                courseId,
                chapterId: newChapterId,
                chapterTitle: cachedChapter.chapterTitle,
                youtubeVideoId: cachedChapter.youtubeVideoId,
                contentMaterials: cachedChapter.contentMaterials,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return NextResponse.json({ youtubeVideoId: cachedChapter.youtubeVideoId });
        }

        console.log("[CACHE MISS] Queuing background job for:", chapter.chapterTitle);

        // Dispatch Background Job to Inngest
        try {
            await inngest.send({
                name: "video/generate",
                data: {
                    chapter,
                    courseId,
                    courseName: courseRow[0].courseName,
                    language: courseRow[0].language
                }
            });
        } catch (inngestErr: any) {
            console.error("[inngest.send] Dispatch Failed:", inngestErr?.body || inngestErr?.message || inngestErr);
            throw inngestErr;
        }

        return NextResponse.json({ status: "queued" });
    } catch (e: any) {
        console.error("[generate-video-content] Internal Server Error:", e?.message || e?.body || JSON.stringify(e));
        return NextResponse.json({ error: "Internal Server Error", detail: e?.message || "Unknown error during queueing" }, { status: 500 });
    }
}
