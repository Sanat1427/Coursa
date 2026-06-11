import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProgressTable, courseTable, courseCompletionTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { RetentionService } from "@/lib/retentionService";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
        if (!safeUserEmail) {
            return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
        }

        const { courseId, chapterId, progressPercentage } = await req.json();

        if (!courseId || !chapterId) {
            return NextResponse.json({ error: "Missing courseId or chapterId" }, { status: 400 });
        }

        // Validate percentage input
        const progress = Math.min(100, Math.max(0, typeof progressPercentage === 'number' ? progressPercentage : parseInt(progressPercentage, 10) || 0));

        let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
        let completedAt: Date | null = null;

        if (progress >= 100) {
            status = 'COMPLETED';
            completedAt = new Date();
        } else if (progress > 0) {
            status = 'IN_PROGRESS';
        }

        // Check if progress already exists
        const existingProgress = await db.select().from(userProgressTable)
            .where(
                and(
                    eq(userProgressTable.userId, safeUserEmail),
                    eq(userProgressTable.courseId, courseId),
                    eq(userProgressTable.chapterId, chapterId)
                )
            )
            .limit(1);

        let result;
        if (existingProgress.length > 0) {
            // Update existing progress record
            const updated = await db.update(userProgressTable)
                .set({
                    status,
                    progressPercentage: progress,
                    completedAt,
                    lastVisitedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(userProgressTable.id, existingProgress[0].id))
                .returning();
            result = updated[0];
        } else {
            // Create a new progress record
            const inserted = await db.insert(userProgressTable)
                .values({
                    userId: safeUserEmail,
                    courseId,
                    chapterId,
                    status,
                    progressPercentage: progress,
                    completedAt,
                    lastVisitedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();
            result = inserted[0];
        }

        // Check if the user has completed all chapters of the course
        if (status === 'COMPLETED') {
            // Initialize Spaced Repetition Schedule in background
            RetentionService.initializeSchedule(safeUserEmail, courseId, chapterId).catch(err => {
                console.error("Failed to initialize Spaced Repetition Schedule:", err);
            });

            try {
                const courseRows = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
                if (courseRows.length > 0) {
                    const course = courseRows[0];
                    const courseChapters = (course.courseLayout as any)?.chapters || [];
                    const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;

                    if (totalChapters > 0) {
                        // Count completed chapters for this user and course
                        const completedChapters = await db.select().from(userProgressTable)
                            .where(
                                and(
                                    eq(userProgressTable.userId, safeUserEmail),
                                    eq(userProgressTable.courseId, courseId),
                                    eq(userProgressTable.status, 'COMPLETED')
                                )
                            );
                        
                        if (completedChapters.length >= totalChapters) {
                            // Check if completion is already logged
                            const existingCompletion = await db.select().from(courseCompletionTable)
                                .where(
                                    and(
                                        eq(courseCompletionTable.userId, safeUserEmail),
                                        eq(courseCompletionTable.courseId, courseId)
                                    )
                                )
                                .limit(1);
                            
                            if (existingCompletion.length === 0) {
                                await db.insert(courseCompletionTable).values({
                                    userId: safeUserEmail,
                                    courseId,
                                    completedAt: new Date()
                                });
                                console.log(`Course completed: user=${safeUserEmail}, course=${courseId}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to track course completion:", err);
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("POST /api/course/progress error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}

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

        const courseId = req.nextUrl.searchParams.get("courseId");
        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
        }

        const chapterId = req.nextUrl.searchParams.get("chapterId");
        if (chapterId) {
            // Find or create progress record and increment views
            const existingProgress = await db.select().from(userProgressTable)
                .where(
                    and(
                        eq(userProgressTable.userId, safeUserEmail),
                        eq(userProgressTable.courseId, courseId),
                        eq(userProgressTable.chapterId, chapterId)
                    )
                )
                .limit(1);

            let resultRow;
            if (existingProgress.length > 0) {
                const updated = await db.update(userProgressTable)
                    .set({
                        views: existingProgress[0].views + 1,
                        lastVisitedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(userProgressTable.id, existingProgress[0].id))
                    .returning();
                resultRow = updated[0];
            } else {
                const inserted = await db.insert(userProgressTable)
                    .values({
                        userId: safeUserEmail,
                        courseId,
                        chapterId,
                        status: 'NOT_STARTED',
                        progressPercentage: 0,
                        views: 1,
                        lastVisitedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();
                resultRow = inserted[0];
            }
            return NextResponse.json(resultRow);
        }

        const progressRows = await db.select().from(userProgressTable)
            .where(
                and(
                    eq(userProgressTable.userId, safeUserEmail),
                    eq(userProgressTable.courseId, courseId)
                )
            );

        return NextResponse.json(progressRows);
    } catch (error: any) {
        console.error("GET /api/course/progress error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}
