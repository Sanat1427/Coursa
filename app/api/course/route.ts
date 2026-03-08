import { db } from "@/config/db";
import { chaptersTable, courseTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');
        const user = await currentUser();

        if (!courseId) {
            const usercourses = await db.select().from(courseTable)
                .where(eq(courseTable.userId, user?.primaryEmailAddress?.emailAddress as string)).orderBy(courseTable.createdAt);
            return NextResponse.json(usercourses);
        }


        const userId = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`Fetching Course: ID=${courseId}, UserID=${userId}`);

        const courses = await db.select({
            courseId: courseTable.courseId,
            courseName: courseTable.courseName,
            userInput: courseTable.userInput,
            type: courseTable.type,
            courseLayout: courseTable.courseLayout,
            createdAt: courseTable.createdAt,
            updatedAt: courseTable.updatedAt,
        }).from(courseTable).where(
            and(
                eq(courseTable.courseId, courseId),
                eq(courseTable.userId, userId)
            )
        );

        if (!courses || courses.length === 0) {
            console.warn(`Course 404: courseId doesn't exist or userId doesn't match!`);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const chapters = await db.select().from(chaptersTable)
            .where(eq(chaptersTable?.courseId, courseId as string));

        return NextResponse.json({
            ...courses[0],
            chapters: chapters
        });
    } catch (e: any) {
        console.error("Internal Server Error: ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { chapterContentSlidesTable } from "@/config/schema";

// Inside the same file route.ts:

export async function DELETE(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');
        const user = await currentUser();

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        // 1. Verify Ownership
        const course = await db.select().from(courseTable).where(
            and(
                eq(courseTable.courseId, courseId),
                eq(courseTable.userId, safeUserEmail)
            )
        );

        if (!course || course.length === 0) {
            return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
        }

        // 2. Cascade Delete: Start with slides which depend on chapters
        await db.delete(chapterContentSlidesTable)
            .where(eq(chapterContentSlidesTable.courseId, courseId));

        // 3. Delete chapters which depend on course
        await db.delete(chaptersTable)
            .where(eq(chaptersTable.courseId, courseId));

        // 4. Delete the main course record
        await db.delete(courseTable)
            .where(eq(courseTable.courseId, courseId));

        return NextResponse.json({ success: true, message: "Course deleted successfully" });
    } catch (e: any) {
        console.error("Internal Server Error (DELETE): ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
