import { db } from "@/config/db";
import { chapterContentSlidesTable, courseTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const courseId = req.nextUrl.searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const user = await currentUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        const chaptercontentslide= await db.select().from(chapterContentSlidesTable)
            .where(eq(chapterContentSlidesTable?.courseId, courseId as string))
            .orderBy(chapterContentSlidesTable.slideIndex);
    

        return NextResponse.json({
            ...courses[0],
            chaptercontentslide:chaptercontentslide
        });
    } catch (e: any) {
        console.error("Internal Server Error: ", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


