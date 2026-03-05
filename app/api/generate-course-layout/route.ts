import { db } from "@/config/db";
import { client } from "@/config/gemini";
import { courseTable } from "@/config/schema";
import { Course_config_prompt } from "@/data/Prompt";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { userInput, courseId, type } = await req.json();
        const user = await currentUser();
        console.log("Generating course layout for courseId: ", courseId)
        const resp = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Course Topic is: ' + userInput,
            config: {
                systemInstruction: Course_config_prompt,
                responseMimeType: "application/json",
            }
        });

        const rawResult = resp.text || '';
        const JsonResult = JSON.parse(rawResult);
        const courseResult = await db.insert(courseTable).values({
            userId: user?.id || '',
            courseId: courseId,
            courseName: JsonResult.courseName,
            userInput: userInput,
            type: type,
            courseLayout: JsonResult,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return NextResponse.json({ courseResult });
    } catch (error: any) {
        console.error("Error in generate-course-layout:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

