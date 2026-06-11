import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/lib/recommendationService";

interface RouteProps {
    params: Promise<{
        courseId: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
    try {
        const { courseId } = await params;
        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
        }

        const similar = await RecommendationService.getSimilarRecommendations(courseId, 5);
        return NextResponse.json(similar);
    } catch (e: any) {
        console.error("GET /api/recommendations/similar error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
