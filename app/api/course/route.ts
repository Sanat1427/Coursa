import { db } from "@/config/db";
import { courseTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const courseId = req.nextUrl.searchParams.get('courseId');

    if (!courseId) {
        return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const courses = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId));

    if (!courses || courses.length === 0) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(courses[0]);
}


