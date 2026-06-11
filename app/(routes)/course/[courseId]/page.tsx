import { db } from "@/lib/db";
import { courseTable, chaptersTable, userProgressTable, courseViewsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import CourseWorkspaceLayout from "@/components/CourseWorkspaceLayout";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CoursePreview({ params }: PageProps) {
  const { courseId } = await params;

  // 1. Fetch course details
  const courses = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId)).limit(1);
  if (courses.length === 0) {
    notFound();
  }

  const courseRow = courses[0];

  // 2. Fetch already generated chapters for this course
  const dbChapters = await db.select().from(chaptersTable).where(eq(chaptersTable.courseId, courseId));

  // 3. Align and map chapters based on layout sequence
  const layoutChapters = (courseRow.courseLayout as any)?.chapters || [];
  const chapters = layoutChapters.map((layoutCh: any) => {
    const expectedId = `${courseId}-${layoutCh.chapterId}`;
    const foundDb = dbChapters.find((ch) => ch.chapterId === expectedId);
    return {
      chapterId: expectedId,
      chapterTitle: layoutCh.chapterTitle,
      chapterDescription: layoutCh.chapterDescription,
      subContent: layoutCh.subContent || [],
      youtubeVideoId: foundDb?.youtubeVideoId || null,
      videoContent: { subContent: layoutCh.subContent || [] }
    };
  });

  const course = {
    ...courseRow,
    chapters: chapters
  };

  // 4. Fetch user progress
  const user = await currentUser();
  const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

  // Log course view event
  if (safeUserEmail && courseId) {
    db.insert(courseViewsTable).values({
      userId: safeUserEmail,
      courseId: courseId,
      viewedAt: new Date()
    }).catch(e => console.error("Failed to log course view:", e));
  }

  const progressRows = safeUserEmail 
    ? await db.select().from(userProgressTable)
        .where(
          and(
            eq(userProgressTable.courseId, courseId),
            eq(userProgressTable.userId, safeUserEmail)
          )
        )
    : [];

  return (
    <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10 bg-[#faf8f5]">
      <CourseWorkspaceLayout 
        course={course}
        initialProgressRows={progressRows}
        userEmail={safeUserEmail}
      />
    </div>
  );
}