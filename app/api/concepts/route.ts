import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conceptsTable } from "@/lib/schema";
import { RetentionService } from "@/lib/retentionService";

export async function GET(req: NextRequest) {
    try {
        // Automatically seed if empty
        await RetentionService.seedCoreConcepts();
        const concepts = await db.select().from(conceptsTable);
        return NextResponse.json(concepts);
    } catch (e: any) {
        console.error("GET /api/concepts error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
