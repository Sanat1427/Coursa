import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { RetentionService } from "@/lib/retentionService";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const readiness = await RetentionService.getConceptReadiness(safeUserEmail);

        const edges = readiness.relationships.map(e => ({
            id: `edge-${e.id}`,
            source: e.sourceConceptId,
            target: e.targetConceptId,
            type: e.relationshipType
        }));

        return NextResponse.json({ 
            nodes: readiness.concepts, 
            edges 
        });
    } catch (e: any) {
        console.error("GET /api/knowledge-graph error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
