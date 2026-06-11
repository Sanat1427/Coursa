"use server"

import { db } from "@/lib/db";
import { courseTable, chaptersTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { Course_config_prompt } from "@/data/Prompt";
import { currentUser } from "@clerk/nextjs/server";
import { and, ilike, eq } from "drizzle-orm";

export async function createCourseAction({
    userInput,
    type,
    language,
    courseId
}: {
    userInput: string;
    type: string;
    language: string;
    courseId: string;
}) {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

    // Check Cache
    const existingCourse = await db.select().from(courseTable)
        .where(
            and(
                ilike(courseTable.userInput, userInput),
                eq(courseTable.type, type),
                eq(courseTable.userId, safeUserEmail)
            )
        )
        .limit(1);

    if (existingCourse.length > 0) {
        const course = existingCourse[0];
        const existingChapters = await db.select().from(chaptersTable)
            .where(eq(chaptersTable.courseId, course.courseId));
        
        const totalExpected = (course.courseLayout as any)?.chapters?.length || 0;

        // If the chapters exist and are fully populated in DB, return them immediately
        if (existingChapters.length >= totalExpected && existingChapters.every(ch => ch.youtubeVideoId && ch.contentMaterials)) {
            return { courseId: course.courseId, isCached: true };
        }
    }

    // Generate Layout
    const resp = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Course Topic is: ' + userInput + ', Course Type: ' + type + ', Language: ' + (language || 'English'),
        config: {
            systemInstruction: Course_config_prompt,
            responseMimeType: "application/json",
        }
    });

    const rawResult = resp.text || '';
    const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const JsonResult = JSON.parse(sanitizedResult);

    await db.insert(courseTable).values({
        userId: safeUserEmail,
        courseId: courseId,
        courseName: JsonResult?.courseName || 'Generated Course',
        userInput: userInput,
        type: type,
        language: language || 'English',
        courseLayout: JsonResult,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return { courseId, isCached: false };
}
