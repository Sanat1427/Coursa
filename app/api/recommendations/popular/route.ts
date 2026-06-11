import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/lib/recommendationService";

export async function GET(req: NextRequest) {
    try {
        const popular = await RecommendationService.getPopularRecommendations();
        return NextResponse.json(popular);
    } catch (e: any) {
        console.error("GET /api/recommendations/popular error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
