import { db } from "@/lib/db";
import { courseTable, quizAttemptsTable, quizzesTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Award, Calendar, CheckCircle, BarChart2, Star, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import moment from "moment";

interface PageProps {
    searchParams: Promise<{
        fromCourseId?: string;
    }>;
}

export default async function QuizHistoryPage({ searchParams }: PageProps) {
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

    // Fetch user attempts joined with quiz details and course name
    const history = await db.select({
        attemptId: quizAttemptsTable.attemptId,
        score: quizAttemptsTable.score,
        totalQuestions: quizAttemptsTable.totalQuestions,
        percentage: quizAttemptsTable.percentage,
        createdAt: quizAttemptsTable.createdAt,
        quizTitle: quizzesTable.title,
        courseName: courseTable.courseName,
        courseId: courseTable.courseId,
    })
    .from(quizAttemptsTable)
    .innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.quizId))
    .innerJoin(courseTable, eq(quizzesTable.courseId, courseTable.courseId))
    .where(eq(quizAttemptsTable.userId, safeUserEmail))
    .orderBy(desc(quizAttemptsTable.createdAt));

    // Stats calculations
    const totalAttempts = history.length;
    const perfectScores = history.filter(h => h.percentage === 100).length;
    const averageScore = totalAttempts > 0 ? Math.round(history.reduce((sum, h) => sum + h.percentage, 0) / totalAttempts) : 0;

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10">
            {/* Header Navigation */}
            <div className="w-full max-w-4xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={fromCourseId ? `/profile?fromCourseId=${fromCourseId}` : "/profile"}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                            Back to Profile
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
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        Canvas Homepage
                    </button>
                </Link>
            </div>

            {/* Profile Summary Header */}
            <div className="w-full max-w-4xl text-center md:text-left mb-10">
                <h1 className="font-display text-5xl font-bold text-slate-900">Quiz Sheet History 📓</h1>
                <p className="font-sans text-xl text-slate-500 mt-2">Track your graded practice worksheets and scores.</p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl mb-12">
                {/* Total Attempts */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 rotate-1">
                    <BarChart2 className="w-10 h-10 text-sketch-blue" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{totalAttempts}</span>
                    <span className="font-sans text-slate-500 font-medium">Sheets Attempted</span>
                </div>
                {/* Average Score */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 -rotate-1">
                    <Award className="w-10 h-10 text-sketch-primary" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{averageScore}%</span>
                    <span className="font-sans text-slate-500 font-medium">Average Accuracy</span>
                </div>
                {/* Perfect Sheets */}
                <div className="wobbly-border hard-shadow bg-white p-6 flex flex-col items-center gap-2 rotate-1">
                    <Star className="w-10 h-10 text-sketch-yellow fill-sketch-yellow" />
                    <span className="font-display text-4xl font-bold text-slate-900 mt-2">{perfectScores}</span>
                    <span className="font-sans text-slate-500 font-medium">Perfect (100%) Scores</span>
                </div>
            </div>

            {/* History List */}
            <div className="w-full max-w-4xl">
                <h2 className="font-display text-3xl font-bold text-slate-900 mb-6">Grades Log</h2>
                
                <div className="flex flex-col gap-6">
                    {history.map((attempt, index) => {
                        // Determine color based on score
                        const isPerfect = attempt.percentage === 100;
                        const isGood = attempt.percentage >= 80;
                        const isPass = attempt.percentage >= 50;

                        return (
                            <div 
                                key={attempt.attemptId} 
                                className={`wobbly-border hard-shadow bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                                    index % 2 === 0 ? "-rotate-0.5" : "rotate-0.5"
                                }`}
                            >
                                <div className="flex flex-col gap-2 flex-grow max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h3 className="font-display text-2xl font-bold text-slate-900">
                                            {attempt.quizTitle}
                                        </h3>
                                        {isPerfect && (
                                            <span className="px-2 py-0.5 text-xs font-display font-bold bg-sketch-yellow/30 text-amber-800 wobbly-border rotate-[-1deg] flex items-center gap-1 shrink-0">
                                                ★ Perfect Score
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-sans text-slate-500 text-sm">
                                        Course: <span className="font-medium text-slate-700">{attempt.courseName}</span>
                                    </p>
                                    <div className="flex items-center gap-4 text-xs font-sans text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {moment(attempt.createdAt).format("MMM DD, YYYY - h:mm A")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className={`px-4 py-2 wobbly-border font-display text-xl font-bold flex flex-col items-center min-w-20 ${
                                        isGood 
                                            ? "bg-green-50 text-green-700 border-green-300" 
                                            : isPass 
                                            ? "bg-amber-50 text-amber-700 border-amber-300" 
                                            : "bg-red-50 text-red-700 border-red-300"
                                    }`}>
                                        <span>{attempt.percentage}%</span>
                                        <span className="text-xs font-sans font-medium text-slate-400">{attempt.score}/{attempt.totalQuestions} Right</span>
                                    </div>
                                    <Link href={`/course/${attempt.courseId}`}>
                                        <button className="bg-black text-white p-3 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shrink-0 cursor-pointer" title="Go to Course">
                                            <BookOpen className="w-5 h-5" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    {history.length === 0 && (
                        <div className="w-full p-16 wobbly-border border-dashed text-center bg-white hard-shadow">
                            <p className="font-display text-2xl text-slate-400 italic">
                                You haven't taken any quizzes yet.
                            </p>
                            <Link href="/">
                                <button className="mt-6 bg-sketch-primary text-white font-display text-xl px-8 py-3 wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                                    Explore Courses & Quizzes 🚀
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
