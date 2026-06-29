import { db } from "@/lib/db";
import { chaptersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface WorkedExample {
    title: string;
    code: string;
    explanation: string;
}

export interface ChapterContent {
    summary: string;
    workedExamples: WorkedExample[];
}

/**
 * Builds the prompt for generating the summary and worked examples for a chapter.
 */
export function buildChapterSummaryPrompt(chapterTitle: string, subContent: string[]): string {
    return `
You are an expert instructor in software engineering.
For the chapter titled "${chapterTitle}" covering: ${JSON.stringify(subContent)}.
Generate:
1. An engaging, clear, and comprehensive Chapter Summary (2-3 paragraphs explaining the core principles, why they matter, and how they fit into the broader system).
2. A list of 2-3 Worked Examples. Each example must have:
   - title: Title of the example
   - code: Actual clean code snippet (in JavaScript, Python, or TypeScript) or step-by-step logic
   - explanation: In-depth explanation of how it works and the logic behind it

Return the response ONLY as a valid JSON object matching the schema:
{
  "summary": "Summary text...",
  "workedExamples": [
    {
      "title": "Example Title",
      "code": "code snippet...",
      "explanation": "Explanation..."
    }
  ]
}
`;
}

/**
 * Parses and normalizes the AI JSON response to ensure we always get a standardized ChapterContent structure,
 * handling any inconsistent naming variations (e.g. codingExamples vs workedExamples).
 */
export function parseAndValidateChapterContent(jsonText: string): ChapterContent {
    const sanitized = jsonText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const data = JSON.parse(sanitized);

    // Normalize summary property variations
    const summary = data.summary || data.courseSummary || data.chapterSummary || "";

    // Normalize worked examples property variations
    const rawExamples = data.workedExamples || data.codingExamples || data.practicalExamples || data.workingExamples || data.examples || [];
    const workedExamples: WorkedExample[] = (Array.isArray(rawExamples) ? rawExamples : []).map((ex: any) => {
        return {
            title: ex.title || ex.name || "Example",
            code: ex.code || ex.snippet || "",
            explanation: ex.explanation || ex.description || ""
        };
    });

    // Validation
    if (!summary || summary.trim() === "") {
        throw new Error("Validation Failed: Summary is empty.");
    }
    if (workedExamples.length === 0) {
        throw new Error("Validation Failed: Worked examples list is empty.");
    }

    return {
        summary,
        workedExamples
    };
}

/**
 * Persists the generated summary and worked examples into the database.
 */
export async function saveChapterContent(chapterId: string, content: ChapterContent): Promise<void> {
    // Retrieve the existing row first to preserve other contentMaterials (like articles)
    const rows = await db.select().from(chaptersTable).where(eq(chaptersTable.chapterId, chapterId)).limit(1);
    if (rows.length === 0) {
        throw new Error(`Chapter not found in database: ${chapterId}`);
    }

    const chapterRow = rows[0];
    let materials = chapterRow.contentMaterials as any;
    if (typeof materials === "string") {
        try {
            materials = JSON.parse(materials);
        } catch {
            materials = { articles: [] };
        }
    } else if (!materials) {
        materials = { articles: [] };
    }

    // Merge generated content
    materials.summary = content.summary;
    materials.workedExamples = content.workedExamples;

    await db.update(chaptersTable)
        .set({ contentMaterials: materials })
        .where(eq(chaptersTable.chapterId, chapterId));
}
