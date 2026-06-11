import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conceptsTable, conceptRelationshipsTable } from "@/lib/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const concepts = await db.select().from(conceptsTable).where(eq(conceptsTable.id, id)).limit(1);
        if (concepts.length === 0) {
            return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        }

        const relationships = await db.select().from(conceptRelationshipsTable)
            .where(
                or(
                    eq(conceptRelationshipsTable.sourceConceptId, id),
                    eq(conceptRelationshipsTable.targetConceptId, id)
                )
            );

        const allConcepts = await db.select().from(conceptsTable);
        const conceptMap = new Map(allConcepts.map(c => [c.id, c]));

        const prerequisites: any[] = [];
        const advancedTopics: any[] = [];
        const related: any[] = [];
        const usedIn: any[] = [];

        for (const rel of relationships) {
            if (rel.relationshipType === 'PREREQUISITE') {
                if (rel.targetConceptId === id) {
                    prerequisites.push(conceptMap.get(rel.sourceConceptId));
                } else {
                    usedIn.push(conceptMap.get(rel.targetConceptId));
                }
            } else if (rel.relationshipType === 'ADVANCED_TOPIC') {
                if (rel.sourceConceptId === id) {
                    advancedTopics.push(conceptMap.get(rel.targetConceptId));
                } else {
                    prerequisites.push(conceptMap.get(rel.sourceConceptId));
                }
            } else if (rel.relationshipType === 'USED_IN') {
                if (rel.sourceConceptId === id) {
                    usedIn.push(conceptMap.get(rel.targetConceptId));
                } else {
                    prerequisites.push(conceptMap.get(rel.sourceConceptId));
                }
            } else if (rel.relationshipType === 'RELATED') {
                const otherId = rel.sourceConceptId === id ? rel.targetConceptId : rel.sourceConceptId;
                related.push(conceptMap.get(otherId));
            }
        }

        return NextResponse.json({
            concept: concepts[0],
            prerequisites: prerequisites.filter(Boolean),
            advancedTopics: advancedTopics.filter(Boolean),
            related: related.filter(Boolean),
            usedIn: usedIn.filter(Boolean)
        });
    } catch (e: any) {
        console.error("GET /api/concepts/[id] error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
