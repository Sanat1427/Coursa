import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/lib/recommendationService";
import { currentUser } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

const getCachedRecommendations = unstable_cache(
    async (userId: string) => {
        const collaborative = await RecommendationService.getCollaborativeRecommendations(userId);
        const category = await RecommendationService.getCategoryRecommendations(userId);
        const popular = await RecommendationService.getPopularRecommendations();
        const finalRecommendations = await RecommendationService.getHybridRecommendations(userId);

        return {
            collaborative,
            category,
            popular,
            finalRecommendations
        };
    },
    ["user-recommendations"],
    {
        revalidate: 30, // 30 seconds cache
        tags: ["recommendations"]
    }
);

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const bypassCache = req.nextUrl.searchParams.get("refresh") === "true";
        
        let data;
        if (bypassCache) {
            data = {
                collaborative: await RecommendationService.getCollaborativeRecommendations(safeUserEmail),
                category: await RecommendationService.getCategoryRecommendations(safeUserEmail),
                popular: await RecommendationService.getPopularRecommendations(),
                finalRecommendations: await RecommendationService.getHybridRecommendations(safeUserEmail)
            };
        } else {
            data = await getCachedRecommendations(safeUserEmail);
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("GET /api/recommendations error:", e);
        return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
    }
}
