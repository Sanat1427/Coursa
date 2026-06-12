import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCachedLearningInsights, getCachedKnowledgeGraph } from "@/app/actions/cache";
import RevisionDashboardClient from "./_components/RevisionDashboardClient";

export default async function RevisionDashboard() {
    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
    if (!safeUserEmail) {
        redirect("/sign-in");
    }

    // Parallel server-side data fetching from database/cache
    const [insights, graphData] = await Promise.all([
        getCachedLearningInsights(safeUserEmail),
        getCachedKnowledgeGraph(safeUserEmail)
    ]);

    return (
        <RevisionDashboardClient 
            initialInsights={insights} 
            initialGraphData={graphData} 
        />
    );
}

