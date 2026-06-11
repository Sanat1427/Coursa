"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, BarChart2, BookOpen, CheckCircle, Award, RefreshCw, Loader2, Play, Activity, Calendar, FileText, Flame } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from "recharts";

export default function AnalyticsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromCourseId = searchParams.get("fromCourseId");
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activityTab, setActivityTab] = useState<"daily" | "weekly" | "monthly">("daily");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        } else if (user) {
            fetchAnalytics();
        }
    }, [user, isLoaded]);

    const fetchAnalytics = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const url = forceRefresh ? "/api/analytics?refresh=true" : "/api/analytics";
            const res = await axios.get(url);
            setData(res.data);
            if (forceRefresh) {
                toast.success("Analytics data re-cached and refreshed!");
            }
        } catch (e) {
            console.error("Failed to load analytics data", e);
            toast.error("Could not load analytics metrics");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (!mounted || !isLoaded || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dot-pattern">
                <div className="wobbly-border bg-white p-8 hard-shadow max-w-sm text-center flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-sketch-primary" />
                    <span className="font-display text-xl text-slate-500 italic">Compiling notebook metrics...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dot-pattern">
                <div className="wobbly-border bg-white p-8 hard-shadow max-w-md text-center">
                    <p className="font-display text-2xl font-bold text-red-600">No Data Available</p>
                    <p className="font-sans text-slate-600 mt-2">We could not retrieve any learning metrics. Get started by sketching a course!</p>
                    <Link href="/" className="mt-4 inline-block">
                        <button className="bg-sketch-primary text-white font-display text-lg px-6 py-2 wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                            Sketch Course 🚀
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const { userStats, quizStats, courseProgress, topChapters, dailyActivity, weeklyActivity, monthlyActivity } = data;

    // Determine active activity dataset
    const activityData = 
        activityTab === "daily" ? dailyActivity : 
        activityTab === "weekly" ? weeklyActivity : monthlyActivity;

    // Custom Sketchbook Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="wobbly-border p-3 bg-white hard-shadow-sm font-sans text-xs flex flex-col gap-1 border border-slate-200">
                    <p className="font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1 mb-1">{label}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.color }} className="font-medium">
                            {p.name === "completions" ? "Completed Lessons" : p.name === "quizzes" ? "Quiz Submissions" : "Notes Updates"}: {p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip for Quiz Line Chart
    const QuizTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="wobbly-border p-3 bg-white hard-shadow-sm font-sans text-xs flex flex-col gap-1 border border-slate-200">
                    <p className="font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1 mb-1">
                        {dataPoint.quizTitle || "Chapter Quiz"}
                    </p>
                    <p className="text-sketch-primary font-bold">
                        Score: {dataPoint.percentage}% ({dataPoint.score}/{dataPoint.totalQuestions} correct)
                    </p>
                    <p className="text-slate-400 text-[10px]">
                        Taken: {new Date(dataPoint.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10">
            {/* Header Navigation */}
            <div className="w-full max-w-5xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                    <button 
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-slate-50 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                        title="Force recalculate and reload cache"
                    >
                        {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        <span>Sync 🔄</span>
                    </button>
                    <Link href="/revision">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-sketch-primary font-bold">
                            Retention & Graph 🧠
                        </button>
                    </Link>
                </div>
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        Canvas Homepage
                    </button>
                </Link>
            </div>

            {/* Dashboard Header */}
            <div className="w-full max-w-5xl text-center md:text-left mb-10">
                <h1 className="font-display text-5xl font-bold text-slate-900">Learning Analytics 📊</h1>
                <p className="font-sans text-xl text-slate-500 mt-2">Interactive insights into your course completions, quiz retention, and study logs.</p>
            </div>

            {/* Overall Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-8">
                {/* Stats Card 1 */}
                <div className="wobbly-border hard-shadow bg-white p-5 flex items-center justify-between gap-4 rotate-1">
                    <div className="flex flex-col">
                        <span className="font-sans text-sm text-slate-500 font-semibold uppercase">Total Courses</span>
                        <span className="font-display text-3xl font-bold text-slate-900 mt-1">
                            {userStats.totalCourses}
                        </span>
                        <span className="text-xs text-slate-400 font-sans mt-1">
                            {userStats.completedCourses} completed • {userStats.activeCourses} active
                        </span>
                    </div>
                    <BookOpen className="w-10 h-10 text-sketch-blue shrink-0" />
                </div>
                {/* Stats Card 2 */}
                <div className="wobbly-border hard-shadow bg-white p-5 flex items-center justify-between gap-4 -rotate-1">
                    <div className="flex flex-col">
                        <span className="font-sans text-sm text-slate-500 font-semibold uppercase">Lessons Finished</span>
                        <span className="font-display text-3xl font-bold text-slate-900 mt-1">
                            {userStats.totalChaptersCompleted}
                        </span>
                        <span className="text-xs text-slate-400 font-sans mt-1">
                            Chapters marked as completed
                        </span>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600 shrink-0" />
                </div>
                {/* Stats Card 3 */}
                <div className="wobbly-border hard-shadow bg-white p-5 flex items-center justify-between gap-4 rotate-1">
                    <div className="flex flex-col">
                        <span className="font-sans text-sm text-slate-500 font-semibold uppercase">Quizzes Taken</span>
                        <span className="font-display text-3xl font-bold text-slate-900 mt-1">
                            {quizStats.totalQuizzesAttempted}
                        </span>
                        <span className="text-xs text-slate-400 font-sans mt-1">
                            Graded practice worksheets
                        </span>
                    </div>
                    <Flame className="w-10 h-10 text-sketch-orange shrink-0" />
                </div>
                {/* Stats Card 4 */}
                <div className="wobbly-border hard-shadow bg-white p-5 flex items-center justify-between gap-4 -rotate-1">
                    <div className="flex flex-col">
                        <span className="font-sans text-sm text-slate-500 font-semibold uppercase">Average Score</span>
                        <span className="font-display text-3xl font-bold text-slate-900 mt-1">
                            {quizStats.avgQuizScore}%
                        </span>
                        <span className="text-xs text-slate-400 font-sans mt-1">
                            Highest score: {quizStats.highestQuizScore}%
                        </span>
                    </div>
                    <Award className="w-10 h-10 text-sketch-primary shrink-0" />
                </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="flex flex-col gap-8 w-full max-w-5xl">
                
                {/* Row 1: Activity Trends & Quiz Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Activity Trends */}
                    <div className="wobbly-border bg-white p-6 hard-shadow flex flex-col min-h-[380px] relative">
                        <div className="thumbtack absolute -top-3 left-6 z-20"></div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-dashed border-slate-200 pb-4 mb-6 gap-3">
                            <h3 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-sketch-primary" /> Study Activity
                            </h3>
                            {/* Toggle Tabs */}
                            <div className="flex wobbly-border border-slate-200 text-xs overflow-hidden shrink-0 bg-slate-50/50">
                                {["daily", "weekly", "monthly"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActivityTab(tab as any)}
                                        className={`px-3 py-1 font-display text-sm font-bold transition-all cursor-pointer border-r last:border-0 border-slate-200 ${
                                            activityTab === tab
                                                ? "bg-black text-white"
                                                : "text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tab.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Stacked BarChart */}
                        <div className="flex-1 w-full h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={activityData}
                                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontStyle="italic" />
                                    <YAxis stroke="#64748b" fontSize={11} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="top" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => (
                                            <span className="font-sans text-xs text-slate-500 font-medium capitalize">
                                                {value === "completions" ? "Completed Lessons" : value === "quizzes" ? "Quizzes" : "Notes Updates"}
                                            </span>
                                        )}
                                    />
                                    <Bar dataKey="completions" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="quizzes" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="notes" stackId="a" fill="#af25f4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quiz Performance Trends */}
                    <div className="wobbly-border bg-white p-6 hard-shadow flex flex-col min-h-[380px] relative">
                        <div className="thumbtack absolute -top-3 left-6 z-20"></div>
                        <div className="border-b border-dashed border-slate-200 pb-4 mb-6">
                            <h3 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Award className="w-5 h-5 text-sketch-orange" /> Quiz Retention Trend
                            </h3>
                        </div>

                        <div className="flex-1 w-full h-[280px] flex items-center justify-center">
                            {quizStats.quizTrends.length === 0 ? (
                                <div className="text-slate-400 font-sans italic text-sm text-center p-8 border border-dashed border-slate-200 bg-slate-50/20 w-full rounded">
                                    No quiz attempt data yet. Complete an AI Quiz inside your courses to sketch the line chart!
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={quizStats.quizTrends}
                                        margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="quizTitle" 
                                            stroke="#64748b" 
                                            fontSize={9} 
                                            tickFormatter={(val) => val && val.length > 12 ? `${val.substring(0, 10)}...` : val}
                                        />
                                        <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                        <Tooltip content={<QuizTooltip />} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="percentage" 
                                            stroke="#af25f4" 
                                            strokeWidth={3} 
                                            activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Course Progress & Leaderboards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Course Progress Chart */}
                    <div className="wobbly-border bg-white p-6 hard-shadow flex flex-col min-h-[350px] relative">
                        <div className="thumbtack absolute -top-3 left-6 z-20"></div>
                        <div className="border-b border-dashed border-slate-200 pb-4 mb-6">
                            <h3 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-sketch-blue" /> Course Completion Rates
                            </h3>
                        </div>

                        <div className="flex-1 w-full h-[250px] flex items-center justify-center">
                            {courseProgress.length === 0 ? (
                                <div className="text-slate-400 font-sans italic text-sm text-center p-8 border border-dashed border-slate-200 bg-slate-50/20 w-full rounded">
                                    No courses generated. Go back to homepage to generate your first course layout!
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={courseProgress}
                                        layout="vertical"
                                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} fontSize={10} stroke="#64748b" />
                                        <YAxis 
                                            type="category" 
                                            dataKey="courseName" 
                                            fontSize={10} 
                                            stroke="#64748b" 
                                            width={100}
                                            tickFormatter={(val) => val && val.length > 15 ? `${val.substring(0, 12)}...` : val}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [`${value}%`, "Completion"]}
                                            contentStyle={{
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "4px",
                                                fontFamily: "var(--font-sans)",
                                                fontSize: "11px",
                                            }}
                                        />
                                        <Bar dataKey="progressPercentage" fill="#0284c7" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Leaderboard: Most Viewed Chapters */}
                    <div className="wobbly-border bg-white p-6 hard-shadow flex flex-col min-h-[350px] relative">
                        <div className="thumbtack absolute -top-3 left-6 z-20"></div>
                        <div className="border-b border-dashed border-slate-200 pb-4 mb-5">
                            <h3 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-sketch-yellow fill-sketch-yellow/10" /> Most Studied Lessons
                            </h3>
                        </div>

                        <div className="flex-grow flex flex-col gap-3">
                            {topChapters.length === 0 ? (
                                <div className="text-slate-400 font-sans italic text-sm text-center p-8 border border-dashed border-slate-200 bg-slate-50/20 w-full rounded flex-grow flex items-center justify-center">
                                    No lesson view counts recorded yet. Start watching chapter videos to update leaderboard metrics!
                                </div>
                            ) : (
                                topChapters.map((chapter: any, rank: number) => (
                                    <div 
                                        key={chapter.chapterId}
                                        className="wobbly-border border border-slate-200 bg-slate-50/45 p-3.5 flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-display text-sm font-bold flex items-center justify-center shrink-0">
                                                {rank + 1}
                                            </span>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-display text-base font-bold text-slate-800 truncate leading-snug">
                                                    {chapter.chapterTitle}
                                                </span>
                                                <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 wobbly-border w-fit mt-1.5 ${
                                                    chapter.status === "COMPLETED" 
                                                        ? "bg-green-100 text-green-700" 
                                                        : chapter.status === "IN_PROGRESS"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}>
                                                    {chapter.status === "COMPLETED" ? "Finished" : chapter.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="font-display text-2xl font-bold text-slate-900">
                                                {chapter.views}
                                            </span>
                                            <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold">
                                                Views 👁️
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
