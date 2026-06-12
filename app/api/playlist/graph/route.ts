import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlistGraphNodesTable, playlistGraphEdgesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const courseId = req.nextUrl.searchParams.get("courseId");
        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const nodes = await db.select().from(playlistGraphNodesTable).where(eq(playlistGraphNodesTable.courseId, courseId));
        const edges = await db.select().from(playlistGraphEdgesTable).where(eq(playlistGraphEdgesTable.courseId, courseId));

        return NextResponse.json({
            nodes: nodes.map(n => ({
                id: n.conceptId,
                name: n.label,
                status: 'Ready to Learn',
                category: 'Playlist Node',
                x: n.x,
                y: n.y
            })),
            edges: edges.map(e => ({
                id: `edge-${e.id}`,
                source: e.source,
                target: e.target,
                type: e.type
            }))
        });
    } catch (e: any) {
        console.error("GET /api/playlist/graph error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
