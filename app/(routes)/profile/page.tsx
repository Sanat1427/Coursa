import { db } from "@/lib/db";
import { courseTable, userProgressTable, usersTable, quizAttemptsTable, notesTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, BookOpen, CheckCircle, Sparkles, Award, Play, ClipboardList, FileText } from "lucide-react";
import { redirect } from "next/navigation";
import Image from "next/image";

interface PageProps {
    searchParams: Promise<{
        fromCourseId?: string;
    }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
    const { fromCourseId } = await searchParams;
    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
    if (!safeUserEmail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dot-pattern">
                <div className="wobbly-border bg-white p-8 hard-shadow max-w-md text-center">
                    <p className="font-display text-2xl font-bold text-red-600">Account Error</p>
                    <p className="font-sans text-slate-600 mt-2">No email address is associated with your account.</p>
                </div>
            </div>
        );
    }

    // Fetch local user record for credits balance
    const dbUserRows = await db.select().from(usersTable).where(eq(usersTable.email, safeUserEmail)).limit(1);
    const dbUser = dbUserRows[0];

    // Fetch all user courses
    const userCourses = await db.select().from(courseTable)
        .where(eq(courseTable.userId, safeUserEmail))
        .orderBy(courseTable.createdAt);

    // Fetch all progress records for the user
    const allProgress = await db.select().from(userProgressTable)
        .where(eq(userProgressTable.userId, safeUserEmail));

    // Fetch all quiz attempts for the user
    const allQuizAttempts = await db.select().from(quizAttemptsTable)
        .where(eq(quizAttemptsTable.userId, safeUserEmail));
    const totalQuizzesAttempted = allQuizAttempts.length;

    // Fetch all notes count for the user
    const allNotes = await db.select().from(notesTable)
        .where(eq(notesTable.userId, safeUserEmail));
    const totalNotesTaken = allNotes.length;

    // Count total completed chapters
    const completedChapters = allProgress.filter(p => p.status === 'COMPLETED');
    const totalChaptersCompleted = completedChapters.length;

    // Calculate total completed courses and build course progress list
    let totalCoursesCompleted = 0;
    const coursesWithProgress = userCourses.map(course => {
        const courseChapters = (course.courseLayout as any)?.chapters || [];
        const totalChapters = courseChapters.length || (course.courseLayout as any)?.totalChapters || 0;
        
        const completedForCourse = completedChapters.filter(p => p.courseId === course.courseId);
        const isCompleted = totalChapters > 0 && completedForCourse.length >= totalChapters;
        
        if (isCompleted) {
            totalCoursesCompleted += 1;
        }
        
        const progressPercentage = totalChapters > 0 ? Math.round((completedForCourse.length / totalChapters) * 100) : 0;
        
        return {
            ...course,
            totalChapters,
            completedChapters: completedForCourse.length,
            progressPercentage,
            isCompleted
        };
    });

    const totalCoursesStarted = userCourses.length;

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10">
            {/* Header Navigation */}
            <div className="w-full max-w-5xl mb-8 flex items-center gap-4">
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        <ChevronLeft className="w-5 h-5" />
                        Back to Canvas
                    </button>
                </Link>
                {fromCourseId && (
                    <Link href={`/course/${fromCourseId}`}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                            Back to Course
                        </button>
                    </Link>
                )}
            </div>

            {/* Profile Summary Card */}
            <div className="w-full max-w-5xl bg-white wobbly-border hard-shadow p-8 mb-10 flex flex-col md:flex-row items-center gap-8 relative rotate-[-0.5deg]">
                <div className="thumbtack absolute -top-3 left-10 z-20"></div>
                <div className="relative w-24 h-24 wobbly-border overflow-hidden shrink-0">
                    <Image 
                        src={user.imageUrl || "/avatar-placeholder.png"} 
                        alt={user.fullName || "User Avatar"} 
                        fill 
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col text-center md:text-left gap-2 flex-grow">
                    <h1 className="font-display text-4xl font-bold text-slate-900">
                        {user.fullName || "Creative Learner"}
                    </h1>
                    <p className="font-sans text-lg text-slate-500">{safeUserEmail}</p>
                    {dbUser && (
                        <div className="mt-1 flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="px-3 py-1 bg-sketch-yellow/20 text-slate-800 font-sans text-sm wobbly-border">
                                🎨 {dbUser.credits} Credits Remaining
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-sketch-primary font-sans text-sm wobbly-border font-bold">
                                Member
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-5xl mb-12">
                {/* Stats 1 */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 rotate-1">
                    <BookOpen className="w-10 h-10 text-sketch-blue" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalCoursesStarted}</span>
                    <span className="font-sans text-slate-500 font-medium">Courses Started</span>
                </div>
                {/* Stats 2 */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 -rotate-1">
                    <Award className="w-10 h-10 text-sketch-orange" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalCoursesCompleted}</span>
                    <span className="font-sans text-slate-500 font-medium">Courses Completed</span>
                </div>
                {/* Stats 3 */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 rotate-1">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalChaptersCompleted}</span>
                    <span className="font-sans text-slate-500 font-medium">Chapters Finished</span>
                </div>
                {/* Stats 4 */}
                <Link href={fromCourseId ? `/quiz-history?fromCourseId=${fromCourseId}` : "/quiz-history"} className="w-full">
                    <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 -rotate-1 hover:bg-slate-50/50 transition-colors cursor-pointer text-center h-full">
                        <ClipboardList className="w-10 h-10 text-sketch-primary" />
                        <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalQuizzesAttempted}</span>
                        <span className="font-sans text-sketch-primary font-bold hover:underline">Quizzes Taken ➡️</span>
                    </div>
                </Link>
                {/* Stats 5 */}
                <Link href={fromCourseId ? `/notes?fromCourseId=${fromCourseId}` : "/notes"} className="w-full">
                    <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 rotate-1 hover:bg-slate-50/50 transition-colors cursor-pointer text-center h-full">
                        <FileText className="w-10 h-10 text-sketch-yellow fill-sketch-yellow/10" />
                        <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalNotesTaken}</span>
                        <span className="font-sans text-amber-800 font-bold hover:underline">Notes Taken ➡️</span>
                    </div>
                </Link>
            </div>

            {/* Courses Progress List */}
            <div className="w-full max-w-5xl">
                <h2 className="font-display text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-sketch-yellow fill-sketch-yellow" />
                    Detailed Progress sketches
                </h2>

                <div className="flex flex-col gap-6">
                    {coursesWithProgress.map((course, idx) => (
                        <div 
                            key={course.courseId} 
                            className={`wobbly-border hard-shadow bg-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                                idx % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.5deg]"
                            }`}
                        >
                            <div className="flex flex-col gap-3 flex-grow max-w-2xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="font-display text-2xl font-bold text-slate-900">
                                        {course.courseName}
                                    </h3>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider wobbly-border ${
                                        course.isCompleted 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-sketch-blue/10 text-sketch-blue"
                                    }`}>
                                        {course.isCompleted ? "Completed ✅" : "In Progress ✏️"}
                                    </span>
                                </div>
                                <p className="font-sans text-slate-500 text-sm line-clamp-2">
                                    {(course.courseLayout as any)?.courseDescription || "No description provided."}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-sans text-slate-500">
                                    <span className="flex items-center gap-1">
                                        📁 {course.totalChapters} Chapters
                                    </span>
                                    <span className="flex items-center gap-1">
                                        ✅ {course.completedChapters} Completed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📅 Level: {String((course.courseLayout as any)?.level || "Beginner")}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar column */}
                            <div className="w-full md:w-64 flex flex-col sm:flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0">
                                <div className="w-full flex flex-col gap-1.5">
                                    <div className="flex justify-between text-sm font-sans font-medium text-slate-600">
                                        <span>Completion</span>
                                        <span>{course.progressPercentage}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-100 wobbly-border overflow-hidden relative">
                                        <div 
                                            className="h-full bg-sketch-primary transition-all duration-300"
                                            style={{ width: `${course.progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                                <Link href={`/course/${course.courseId}`} className="w-full sm:w-auto md:w-full">
                                    <button className="w-full bg-black text-white px-5 py-2.5 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-display text-lg flex items-center justify-center gap-2 cursor-pointer">
                                        Resume <Play className="w-4 h-4 fill-white" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}

                    {coursesWithProgress.length === 0 && (
                        <div className="w-full p-16 wobbly-border border-dashed text-center bg-white hard-shadow">
                            <p className="font-display text-2xl text-slate-400 italic">
                                You haven't sketched any courses yet.
                            </p>
                            <Link href="/">
                                <button className="mt-6 bg-sketch-primary text-white font-display text-xl px-8 py-3 wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                                    Start Learning Now 🚀
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
