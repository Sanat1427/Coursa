"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
    Loader2, BrainCircuit, RefreshCw, Award, Activity, 
    Sparkles, AlertTriangle, ShieldCheck, Play, ArrowRight,
    History, ChevronLeft, BookOpen, Layers
} from "lucide-react";
import { toast } from "sonner";
import KnowledgeGraphView from "@/components/KnowledgeGraphView";
import ConceptCardDrawer from "@/components/ConceptCardDrawer";
import { createCourseAction } from "@/app/actions/course";

export default function RevisionDashboard() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [insights, setInsights] = useState<any>(null);
    const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Concept Drawer state
    const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
    const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState(false);

    // Dynamic course generation state
    const [generatingConceptId, setGeneratingConceptId] = useState<string | null>(null);

    // Concept review state
    const [reviewingConceptId, setReviewingConceptId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        } else if (user) {
            fetchData();
        }
    }, [user, isLoaded]);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const [insightsRes, graphRes] = await Promise.all([
                axios.get("/api/learning-insights"),
                axios.get("/api/knowledge-graph")
            ]);

            setInsights(insightsRes.data);
            setGraphData(graphRes.data);
        } catch (e) {
            console.error("Failed to fetch Learning OS dashboard data:", e);
            toast.error("Failed to load dashboard metrics");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleGenerateNextModule = async (concept: any) => {
        setGeneratingConceptId(concept.id);
        const toastId = toast.loading(`Drafting next course layout for [${concept.name}]...`);
        const courseId = crypto.randomUUID();
        try {
            // Trigger course generation using server action
            const res = await createCourseAction({
                userInput: concept.name,
                type: "fullcourse",
                language: "English",
                courseId: courseId
            });

            toast.success(`Sketched next course for [${concept.name}]!`, { id: toastId });
            router.push(`/course/${res.courseId}`);
        } catch (err) {
            console.error("Failed generating course for concept", err);
            toast.error("Failed to generate course module", { id: toastId });
        } finally {
            setGeneratingConceptId(null);
        }
    };

    const handleQuickConceptReview = async (conceptId: string, rating: 'EASY' | 'MEDIUM' | 'HARD') => {
        setReviewingConceptId(conceptId);
        try {
            await axios.post("/api/concepts/review", {
                conceptId,
                rating
            });
            toast.success(`Concept mastery updated: ${rating}`);
            await fetchData(true);
        } catch (err) {
            console.error("Failed to rate concept", err);
            toast.error("Could not save review rating");
        } finally {
            setReviewingConceptId(null);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center gap-3 bg-[#faf8f5]">
                <Loader2 className="w-8 h-8 animate-spin text-sketch-primary" />
                <span className="font-sans italic text-slate-500 text-lg">Loading your Learning Operating System...</span>
            </div>
        );
    }

    // Filter concepts needing review (mastery score < 70)
    const reviewQueue = graphData.nodes.filter(c => c.status === "Needs Review");
    const recommendedQueue = graphData.nodes.filter(c => c.status === "Ready to Learn");

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10 bg-[#faf8f5] w-full">
            
            {/* Top Navigation */}
            <div className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        <ChevronLeft className="w-5 h-5" />
                        Back to Canvas
                    </button>
                </Link>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                >
                    {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    Sync Status
                </button>
            </div>

            {/* Header Title */}
            <div className="w-full max-w-6xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-4xl font-extrabold text-slate-900 flex items-center gap-3">
                        <BrainCircuit className="w-10 h-10 text-sketch-primary animate-sketchbook-float" />
                        AI Learning Operating System 🧠
                    </h1>
                    <p className="font-sans text-slate-500 italic mt-1 font-semibold">
                        Real-time dynamic concept maps, spaced repetition mastery, and downstream learning paths.
                    </p>
                </div>
            </div>

            {/* RPG Progress Stats Panel */}
            {insights?.metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-8">
                    {/* Mastery Level */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex items-center gap-5 relative overflow-hidden bg-emerald-50/20">
                        <div className="thumbtack absolute top-2 right-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="p-3 wobbly-border border-2 border-emerald-500 bg-emerald-100/50 text-emerald-600 rounded">
                            <Award className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-slate-500 text-xs uppercase">Learning Rank</span>
                            <span className="font-display text-lg font-black text-slate-800 leading-tight mt-1">
                                {insights.metrics.learningLevel}
                            </span>
                        </div>
                    </div>

                    {/* Mastered Concepts */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex items-center gap-5 relative overflow-hidden bg-blue-50/20">
                        <div className="thumbtack absolute top-2 right-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="p-3 wobbly-border border-2 border-blue-500 bg-blue-100/50 text-blue-600 rounded">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-slate-500 text-xs uppercase">Concepts Mastered</span>
                            <span className="font-display text-3xl font-black text-slate-800 mt-1">
                                {insights.metrics.conceptsMastered}
                            </span>
                        </div>
                    </div>

                    {/* Needs Review */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex items-center gap-5 relative overflow-hidden bg-amber-50/20">
                        <div className="thumbtack absolute top-2 right-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="p-3 wobbly-border border-2 border-amber-500 bg-amber-100/50 text-amber-600 rounded">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-slate-500 text-xs uppercase">Needs Revision</span>
                            <span className="font-display text-3xl font-black text-slate-800 mt-1">
                                {insights.metrics.needsRevision}
                            </span>
                        </div>
                    </div>

                    {/* Ready to Learn */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex items-center gap-5 relative overflow-hidden bg-purple-50/20">
                        <div className="thumbtack absolute top-2 right-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="p-3 wobbly-border border-2 border-purple-500 bg-purple-100/50 text-purple-600 rounded">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-slate-500 text-xs uppercase">Ready to Learn</span>
                            <span className="font-display text-3xl font-black text-slate-800 mt-1">
                                {insights.metrics.readyToLearn}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Split layout: Active Courses & Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mb-8 items-start">
                
                {/* Left Column: Continuing learning & revision queues (2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
                    {/* 🔥 Continue Learning */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex flex-col relative">
                        <div className="thumbtack absolute -top-3 left-10 pointer-events-none"></div>
                        <h2 className="font-display text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 underline decoration-sketch-orange decoration-2 underline-offset-4">
                            🔥 Continue Learning
                        </h2>

                        {insights?.activeCourses && insights.activeCourses.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50/50 wobbly-border border-dashed border-2 flex flex-col items-center justify-center gap-2">
                                <BookOpen className="w-12 h-12 text-slate-400" />
                                <h3 className="font-display text-xl font-bold text-slate-800 mt-2">All Courses Completed!</h3>
                                <p className="font-sans text-sm text-slate-500 max-w-xs leading-relaxed mt-1">
                                    Unlock recommended topics below or return to the Homepage to sketch a new course!
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {insights?.activeCourses?.map((course: any) => (
                                    <div 
                                        key={course.courseId}
                                        className="p-5 wobbly-border border border-slate-200 bg-[#fdfdfd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors"
                                    >
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-display text-lg font-bold text-slate-800 truncate leading-snug">
                                                {course.courseName}
                                            </h3>
                                            <p className="font-sans text-[11px] text-slate-400 mt-1">
                                                {course.completedChapters} of {course.totalChapters} chapters completed
                                            </p>
                                            <div className="w-full h-2.5 bg-slate-100 wobbly-border overflow-hidden relative mt-3">
                                                <div 
                                                    className="h-full bg-sketch-primary transition-all duration-300"
                                                    style={{ width: `${course.progressPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <Link href={`/course/${course.courseId}`} className="shrink-0 w-full sm:w-auto">
                                            <button className="w-full px-5 py-2.5 bg-black text-white wobbly-border hard-shadow-sm font-display text-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5">
                                                Resume <Play className="w-3.5 h-3.5 fill-white" />
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🧠 Concepts Needing Review */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex flex-col relative">
                        <div className="thumbtack absolute -top-3 left-10 pointer-events-none"></div>
                        <h2 className="font-display text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 underline decoration-sketch-blue decoration-2 underline-offset-4">
                            🧠 Concepts Needing Review
                        </h2>

                        {reviewQueue.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50/50 wobbly-border border-dashed border-2 flex flex-col items-center justify-center gap-2">
                                <ShieldCheck className="w-12 h-12 text-green-500 animate-pulse" />
                                <h3 className="font-display text-xl font-bold text-slate-800 mt-2">Zero Review Deficits!</h3>
                                <p className="font-sans text-sm text-slate-500 max-w-xs leading-relaxed mt-1">
                                    All your active topics are fully consolidated. Complete lessons to active spaced repetition logs.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {reviewQueue.map((concept: any) => (
                                    <div 
                                        key={concept.id}
                                        className="p-5 wobbly-border border border-slate-200 bg-[#fdfdfd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 bg-amber-50 text-amber-700 wobbly-border border">
                                                    Needs Review
                                                </span>
                                                <span className="font-sans text-xs text-slate-400 italic">
                                                    {concept.category}
                                                </span>
                                            </div>
                                            <h3 
                                                onClick={() => {
                                                    setSelectedConceptId(concept.id);
                                                    setIsConceptDrawerOpen(true);
                                                }}
                                                className="font-display text-lg font-bold text-slate-800 mt-1.5 cursor-pointer hover:underline flex items-center gap-1.5"
                                            >
                                                {concept.name}
                                                <span className="font-sans text-xs font-semibold text-amber-600">({concept.masteryScore}%)</span>
                                            </h3>
                                            <p className="font-sans text-slate-500 text-xs mt-1.5 line-clamp-1">
                                                {concept.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                                            {reviewingConceptId === concept.id ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-sketch-primary" />
                                            ) : (
                                                ['HARD', 'MEDIUM', 'EASY'].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => handleQuickConceptReview(concept.id, rating as any)}
                                                        className={`px-2.5 py-1.5 wobbly-border font-display text-[10px] font-bold hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer ${
                                                            rating === 'EASY' ? 'bg-green-100 text-green-700 border-green-400' :
                                                            rating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-400' :
                                                            'bg-red-100 text-red-700 border-red-400'
                                                        }`}
                                                    >
                                                        {rating}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Recommendations & Stats (1 col) */}
                <div className="flex flex-col gap-8">
                    
                    {/* 🎯 Recommended Next Concepts */}
                    <div className="p-6 bg-white wobbly-border hard-shadow flex flex-col relative">
                        <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none"></div>
                        <h2 className="font-display text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 underline decoration-sketch-yellow decoration-4 underline-offset-4">
                            🎯 Recommended Next
                        </h2>

                        {recommendedQueue.length === 0 ? (
                            <div className="p-6 text-center italic text-slate-400 font-sans text-xs bg-slate-50/20 wobbly-border border-dashed border border-slate-200">
                                Master prerequisite topics in the graph to unlock next concepts.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {recommendedQueue.slice(0, 4).map((concept: any) => (
                                    <div 
                                        key={concept.id}
                                        className="p-4 wobbly-border border border-slate-200 bg-[#fdfdfd] flex flex-col gap-3"
                                    >
                                        <div className="min-w-0">
                                            <span className="text-[9px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 bg-blue-50 text-blue-700 wobbly-border border w-fit">
                                                {concept.category}
                                            </span>
                                            <h4 
                                                onClick={() => {
                                                    setSelectedConceptId(concept.id);
                                                    setIsConceptDrawerOpen(true);
                                                }}
                                                className="font-display font-bold text-base text-slate-800 mt-2 cursor-pointer hover:underline"
                                            >
                                                {concept.name}
                                            </h4>
                                            <p className="font-sans text-slate-500 text-[11px] mt-1.5 leading-relaxed line-clamp-2">
                                                {concept.description}
                                            </p>
                                        </div>
                                        
                                        <button
                                            disabled={generatingConceptId !== null}
                                            onClick={() => handleGenerateNextModule(concept)}
                                            className="w-full py-2 bg-sketch-primary text-white wobbly-border font-display text-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            {generatingConceptId === concept.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3.5 h-3.5 text-sketch-yellow fill-sketch-yellow" />
                                            )}
                                            <span>Generate next course</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 📚 Recent Learning Activity */}
                    {insights?.recentActivity && (
                        <div className="p-6 bg-white wobbly-border hard-shadow flex flex-col relative">
                            <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none"></div>
                            <h3 className="font-display text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-500" /> Recent Activity
                            </h3>
                            
                            {insights.recentActivity.length === 0 ? (
                                <p className="text-slate-400 font-sans text-xs italic">No activity recorded yet.</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {insights.recentActivity.map((act: any) => (
                                        <div key={act.id} className="flex flex-col gap-1 text-xs border-b border-dashed border-slate-100 pb-2 last:border-0">
                                            <p className="font-display font-bold text-slate-800 line-clamp-1">
                                                {act.courseName}
                                            </p>
                                            <div className="flex justify-between items-center text-[10px] font-sans text-slate-400 font-medium">
                                                <span className={`uppercase font-bold ${
                                                    act.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'
                                                }`}>
                                                    {act.status}
                                                </span>
                                                <span>
                                                    {new Date(act.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Knowledge Graph Visualization */}
            <div className="w-full max-w-6xl p-6 bg-white wobbly-border hard-shadow relative mb-12">
                <div className="thumbtack absolute -top-3 left-10 pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-sketch-orange" />
                            My Personal Knowledge Tree
                        </h2>
                        <p className="font-sans text-sm text-slate-500 italic mt-0.5">
                            Real-time state tracking of your computer science concepts. Click nodes to explore their card.
                        </p>
                    </div>
                </div>

                {/* Graph View */}
                {graphData.nodes.length > 0 && (
                    <KnowledgeGraphView 
                        nodes={graphData.nodes} 
                        edges={graphData.edges} 
                        onNodeSelect={(cid) => {
                            setSelectedConceptId(cid);
                            setIsConceptDrawerOpen(true);
                        }}
                    />
                )}
            </div>

            {/* Concept Card Encyclopedia Drawer */}
            <ConceptCardDrawer
                conceptId={selectedConceptId}
                isOpen={isConceptDrawerOpen}
                onClose={() => {
                    setIsConceptDrawerOpen(false);
                    setSelectedConceptId(null);
                }}
            />
        </div>
    );
}
