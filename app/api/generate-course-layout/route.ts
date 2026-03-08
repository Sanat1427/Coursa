import { db } from "@/config/db";
import { client } from "@/config/gemini";
import { courseTable } from "@/config/schema";
import { Course_config_prompt } from "@/data/Prompt";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike } from "drizzle-orm";

export const maxDuration = 60; // Allow maximum 60 seconds execution time on Vercel

export async function POST(req: NextRequest) {
    try {
        const { userInput, courseId, type, language } = await req.json();
        const user = await currentUser();
        console.log("Generating course layout for courseId: ", courseId);

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

        // Supabase DB Cache: Check if same course topic + type exists for this user specifically or broadly
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
            console.log("[CACHE HIT] Returning existing course layout for:", userInput);
            // Return existing course details instead of trying to generate or insert duplicate
            return NextResponse.json({
                courseResult: [existingCourse[0]],
                isCached: true
            });
        }

        let rawResult = '';
        try {
            console.log("[CACHE MISS] Generating new course layout via Gemini for:", userInput);
            const resp = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Course Topic is: ' + userInput + ', Course Type: ' + type + ', Language: ' + (language || 'English'),
                config: {
                    systemInstruction: Course_config_prompt,
                    responseMimeType: "application/json",
                }
            });
            rawResult = resp.text || '';
        } catch (geminiError) {
            console.error("Gemini API failed, falling back to Groq...", geminiError);
            if (!process.env.GROQ_API_KEY) {
                throw new Error("Gemini failed and no GROQ_API_KEY is available for fallback.");
            }

            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: Course_config_prompt },
                        { role: "user", content: 'Course Topic is: ' + userInput + ', Course Type: ' + type + ', Language: ' + (language || 'English') }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!groqResponse.ok) {
                const errText = await groqResponse.text();
                console.error("Groq fallback error:", errText);
                throw new Error("Both Gemini and Groq APIs failed.");
            }

            const groqData = await groqResponse.json();
            rawResult = groqData.choices?.[0]?.message?.content || '';
            console.log("[FALLBACK] Successfully generated layout via Groq");
        }

        let JsonResult;
        try {
            // Strip any markdown json formatting the AI might have accidentally appended
            const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            JsonResult = JSON.parse(sanitizedResult);
        } catch (e) {
            console.error("Failed to parse JSON response:", rawResult);
            throw new Error("Invalid format received from AI.");
        }

        const courseResult = await db.insert(courseTable).values({
            userId: safeUserEmail,
            courseId: courseId,
            courseName: JsonResult?.courseName || 'Generated Course',
            userInput: userInput,
            type: type,
            language: language || 'English',
            courseLayout: JsonResult,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning(); // Adding returning() to make sure we return the inserted row

        return NextResponse.json({ courseResult });
    } catch (error: any) {
        console.error("Error in generate-course-layout:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
