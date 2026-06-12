import { db } from "@/lib/db";
import { courseTable, userProgressTable, chaptersTable, revisionScheduleTable, conceptRelationshipsTable } from "@/lib/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { RetentionService } from "@/lib/retentionService";
import { RecommendationService } from "@/lib/recommendationService";
import { unstable_cache } from "next/cache";

export const getCachedLearningInsights = unstable_cache(
    async (userId: string) => {
        // Get readiness data
        const readiness = await RetentionService.getConceptReadiness(userId);

        // Fetch user courses, progress, chapters, and schedules
        const userCourses = await db.select().from(courseTable).where(eq(courseTable.userId, userId));
        const courseIds = userCourses.map(c => c.courseId);

        let allProgress: any[] = [];
        let allChapters: any[] = [];
        let allSchedules: any[] = [];

        if (courseIds.length > 0) {
            [allProgress, allChapters, allSchedules] = await Promise.all([
                db.select().from(userProgressTable).where(eq(userProgressTable.userId, userId)),
                db.select().from(chaptersTable).where(inArray(chaptersTable.courseId, courseIds)),
                db.select().from(revisionScheduleTable).where(
                    and(
                        eq(revisionScheduleTable.userId, userId),
                        eq(revisionScheduleTable.status, 'PENDING'),
                        inArray(revisionScheduleTable.courseId, courseIds)
                    )
                )
            ]);
        }

        const activeCourses = userCourses.map(course => {
            const courseChapters = (course.courseLayout as any)?.chapters || [];
            const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
            
            const completedForCourse = allProgress.filter(
                p => p.courseId === course.courseId && p.status === 'COMPLETED'
            );
            
            const progressPercentage = totalChapters > 0 
                ? Math.round((completedForCourse.length / totalChapters) * 100) 
                : 0;

            // Find chapters in DB for this course
            const dbChapters = allChapters.filter(ch => ch.courseId === course.courseId);

            // Find first incomplete chapter from layout
            const completedIds = new Set(completedForCourse.map(p => p.chapterId));
            const firstIncompleteLayoutCh = courseChapters.find((ch: any) => !completedIds.has(ch.chapterId || ch.id));
            
            let currentChapterName = "Introduction";
            let currentChapterId = "";
            if (firstIncompleteLayoutCh) {
                currentChapterId = firstIncompleteLayoutCh.chapterId || firstIncompleteLayoutCh.id || "";
                const matchedDbCh = dbChapters.find(ch => ch.chapterId === currentChapterId);
                currentChapterName = matchedDbCh?.chapterTitle || firstIncompleteLayoutCh.chapterTitle || firstIncompleteLayoutCh.name || "Untitled Chapter";
            } else if (dbChapters.length > 0) {
                currentChapterName = dbChapters[0].chapterTitle;
                currentChapterId = dbChapters[0].chapterId;
            }

            // Find next pending review date for this course
            const courseSchedules = allSchedules
                .filter(s => s.courseId === course.courseId)
                .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
            
            let nextReviewStr = "None scheduled";
            if (courseSchedules.length > 0) {
                const nextSchedDate = courseSchedules[0].scheduledAt;
                const diffTime = nextSchedDate.getTime() - Date.now();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 0) {
                    nextReviewStr = "Today";
                } else if (diffDays === 1) {
                    nextReviewStr = "Tomorrow";
                } else {
                    nextReviewStr = `In ${diffDays} days`;
                }
            }
            
            return {
                courseId: course.courseId,
                courseName: course.courseName,
                description: (course.courseLayout as any)?.courseDescription || "",
                progressPercentage,
                totalChapters,
                completedChapters: completedForCourse.length,
                currentChapterName,
                currentChapterId,
                nextReview: nextReviewStr
            };
        }).filter(c => c.progressPercentage < 100); // Only show in-progress courses

        // Group categories for progress stats
        const categoryStats = new Map<string, { total: number; learned: number }>();
        readiness.concepts.forEach(c => {
            if (!categoryStats.has(c.category)) {
                categoryStats.set(c.category, { total: 0, learned: 0 });
            }
            const stats = categoryStats.get(c.category)!;
            stats.total += 1;
            if (c.status === "Mastered") {
                stats.learned += 1;
            }
        });

        const categoryCoverage = Array.from(categoryStats.entries()).map(([name, stats]) => ({
            name,
            total: stats.total,
            learned: stats.learned,
            percentage: Math.round((stats.learned / stats.total) * 100)
        }));

        // Sort weak and strong concepts
        const weakConcepts = readiness.concepts
            .filter(c => c.status === "Needs Review")
            .sort((a, b) => a.masteryScore - b.masteryScore)
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.name,
                score: c.masteryScore,
                category: c.category
            }));

        const strongConcepts = readiness.concepts
            .filter(c => c.status === "Mastered")
            .sort((a, b) => b.masteryScore - a.masteryScore)
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.name,
                score: c.masteryScore,
                category: c.category
            }));

        // Dynamic recent activity logs based on user progress & reviews
        const recentActivity = allProgress
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map(p => {
                const matchedCourse = userCourses.find(c => c.courseId === p.courseId);
                return {
                    id: p.id,
                    chapterId: p.chapterId,
                    courseName: matchedCourse?.courseName || "AI Course",
                    status: p.status,
                    timestamp: p.updatedAt
                };
            });

        return {
            metrics: readiness.metrics,
            activeCourses,
            categoryCoverage,
            weakConcepts,
            strongConcepts,
            recentActivity
        };
    },
    ["learning-insights"],
    {
        revalidate: 300, // 5 minutes cache
        tags: ["readiness", "revision"]
    }
);

export const getCachedKnowledgeGraph = unstable_cache(
    async (userId: string) => {
        const readiness = await RetentionService.getConceptReadiness(userId);

        const edges = readiness.relationships.map(e => ({
            id: `edge-${e.id}`,
            source: e.sourceConceptId,
            target: e.targetConceptId,
            type: e.relationshipType
        }));

        return { 
            nodes: readiness.concepts, 
            edges 
        };
    },
    ["knowledge-graph"],
    {
        revalidate: 300, // 5 minutes cache
        tags: ["readiness", "graph"]
    }
);

export const getCachedRecommendations = unstable_cache(
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
        revalidate: 300, // 5 minutes cache
        tags: ["recommendations"]
    }
);
