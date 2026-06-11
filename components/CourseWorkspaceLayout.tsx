"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
    ChevronLeft, Loader2, Play, CheckCircle, Circle, 
    BookOpen, Sparkles, Code2, ClipboardList, RefreshCw, 
    Calendar, BrainCircuit, HeartHandshake, Eye
} from "lucide-react";
import { toast } from "sonner";
import YouTubePlayer from "./YouTubePlayer";
import NotesPanel from "./NotesPanel";
import QuizCard from "./QuizCard";
import ChapterProgressTracker from "./ChapterProgressTracker";
import ConceptCardDrawer from "./ConceptCardDrawer";

type Props = {
    course: any;
    initialProgressRows: any[];
    userEmail: string;
};

export default function CourseWorkspaceLayout({ course, initialProgressRows, userEmail }: Props) {
    const chapters = course.chapters || [];
    const [progressRows, setProgressRows] = useState<any[]>(initialProgressRows);
    const [activeChapter, setActiveChapter] = useState<any>(chapters[0] || null);

    // Workspace loading states
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [workspaceData, setWorkspaceData] = useState<any>(null);
    const [ytPlayer, setYtPlayer] = useState<any>(null);

    // Concept Drawer state
    const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
    const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState(false);

    // Flashcard Quiz state
    const [recallIdx, setRecallIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [ratingLoading, setRatingLoading] = useState(false);

    // Alternative Videos state
    const [showAltDropdown, setShowAltDropdown] = useState(false);
    const [swappingVideo, setSwappingVideo] = useState(false);

    const handleSwapVideo = async (videoId: string) => {
        setSwappingVideo(true);
        const toastId = toast.loading("Swapping video content...");
        try {
            await axios.patch("/api/course", {
                chapterId: activeChapter.chapterId,
                videoId
            });
            toast.success("Video swapped successfully!", { id: toastId });
            setShowAltDropdown(false);
            // Reload workspace data to fetch updated alternatives and metadata
            await loadChapterWorkspace(activeChapter.chapterId);
        } catch (err) {
            console.error("Failed to swap video", err);
            toast.error("Failed to swap video selection", { id: toastId });
        } finally {
            setSwappingVideo(false);
        }
    };

    useEffect(() => {
        if (activeChapter) {
            loadChapterWorkspace(activeChapter.chapterId);
        }
    }, [activeChapter]);

    const loadChapterWorkspace = async (chId: string) => {
        setWorkspaceLoading(true);
        setRecallIdx(0);
        setIsFlipped(false);
        try {
            const res = await axios.get(`/api/course/chapter-learning?courseId=${course.courseId}&chapterId=${chId}`);
            setWorkspaceData(res.data);

            // Record page view for progress tracking
            axios.get(`/api/course/progress?courseId=${course.courseId}&chapterId=${chId}`)
                .then(progressRes => {
                    // Update views in progress rows
                    setProgressRows(prev => {
                        const exists = prev.some(p => p.chapterId === chId);
                        if (exists) {
                            return prev.map(p => p.chapterId === chId ? { ...p, views: p.views + 1 } : p);
                        } else {
                            return [...prev, progressRes.data];
                        }
                    });
                })
                .catch(err => console.error("Failed recording chapter view", err));

        } catch (e) {
            console.error("Failed loading chapter workspace details", e);
            toast.error("Could not load chapter workspace tools");
        } finally {
            setWorkspaceLoading(false);
        }
    };

    const handleProgressChange = (newProgress: number, newStatus: string) => {
        setProgressRows(prev => {
            const exists = prev.some(p => p.chapterId === activeChapter.chapterId);
            if (exists) {
                return prev.map(p => p.chapterId === activeChapter.chapterId 
                    ? { ...p, progressPercentage: newProgress, status: newStatus } 
                    : p
                );
            } else {
                return [...prev, { 
                    chapterId: activeChapter.chapterId, 
                    progressPercentage: newProgress, 
                    status: newStatus,
                    views: 1
                }];
            }
        });
    };

    const handleRecallRating = async (rating: 'EASY' | 'MEDIUM' | 'HARD') => {
        if (!workspaceData?.concepts || workspaceData.concepts.length === 0) return;
        setRatingLoading(true);
        try {
            // Rate all concepts associated with this chapter in background
            const promises = workspaceData.concepts.map((c: any) => 
                axios.post("/api/concepts/review", {
                    conceptId: c.id,
                    rating
                })
            );
            await Promise.all(promises);

            // If there's an active SRS schedule for this chapter, complete it too
            if (workspaceData.revisionStatus?.id) {
                await axios.post("/api/revision/complete", {
                    chapterId: activeChapter.chapterId,
                    scheduleId: workspaceData.revisionStatus.id,
                    rating
                });
            }

            toast.success(`Logged comfort rating: ${rating}`);
            
            // Advance or reset flip
            setIsFlipped(false);
            if (recallIdx < workspaceData.recallQuestions.length - 1) {
                setRecallIdx(prev => prev + 1);
            } else {
                setRecallIdx(0);
                toast.success("Completed all recall questions for this chapter! 🎉");
            }

            // Reload workspace details quietly to refresh mastery scores & status
            const res = await axios.get(`/api/course/chapter-learning?courseId=${course.courseId}&chapterId=${activeChapter.chapterId}`);
            setWorkspaceData(res.data);

        } catch (e) {
            console.error("Failed logging recall rating", e);
            toast.error("Failed to save recall rating");
        } finally {
            setRatingLoading(false);
        }
    };

    const activeProgress = progressRows.find(p => p.chapterId === activeChapter?.chapterId);
    const completedChaptersCount = progressRows.filter(p => p.status === 'COMPLETED').length;
    const overallProgressPercentage = chapters.length > 0 ? Math.round((completedChaptersCount / chapters.length) * 100) : 0;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-dashed border-slate-200 pb-4">
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-base hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Canvas
                    </button>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="font-display font-bold text-slate-700 text-sm">Course Progress:</span>
                    <div className="w-40 sm:w-60 h-4 bg-slate-100 wobbly-border overflow-hidden relative">
                        <div 
                            className="h-full bg-sketch-primary transition-all duration-300"
                            style={{ width: `${overallProgressPercentage}%` }}
                        />
                    </div>
                    <span className="font-display text-lg font-black text-sketch-primary">
                        {overallProgressPercentage}%
                    </span>
                </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* Left Sidebar: Chapters list */}
                <div className="lg:col-span-1 flex flex-col gap-4 sticky top-24">
                    <h3 className="font-display text-lg font-black text-slate-800 uppercase tracking-wider pl-2">
                        📖 Lessons Roadmap
                    </h3>
                    <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
                        {chapters.map((ch: any, idx: number) => {
                            const prog = progressRows.find(p => p.chapterId === ch.chapterId);
                            const isActive = activeChapter?.chapterId === ch.chapterId;
                            const isCompleted = prog?.status === 'COMPLETED';

                            return (
                                <button
                                    key={ch.chapterId}
                                    onClick={() => setActiveChapter(ch)}
                                    className={`w-full text-left p-4 wobbly-border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                        isActive 
                                            ? "bg-black text-white border-black scale-[1.02] hard-shadow" 
                                            : "bg-white text-slate-800 hover:bg-slate-50 hard-shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`w-6 h-6 rounded-full font-display text-xs font-bold flex items-center justify-center shrink-0 ${
                                            isActive ? "bg-white text-black" : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="font-display font-bold text-sm truncate leading-snug">
                                            {ch.chapterTitle}
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle className={`w-5 h-5 ${isActive ? "text-green-400" : "text-green-600"}`} />
                                        ) : (
                                            <Circle className={`w-5 h-5 ${isActive ? "text-white/40" : "text-slate-300"}`} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Workspace */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {activeChapter ? (
                        <div className="bg-white wobbly-border hard-shadow p-6 md:p-8 relative">
                            <div className="thumbtack absolute -top-3 left-10 pointer-events-none"></div>

                            {/* Chapter Header */}
                            <div className="border-b-2 border-dashed border-slate-200 pb-5 mb-6">
                                <h1 className="font-display text-3xl font-black text-slate-900 leading-tight">
                                    {activeChapter.chapterTitle}
                                </h1>
                                <p className="font-sans text-slate-500 italic mt-2 text-sm">
                                    {activeChapter.chapterDescription || "Generate summaries and study tools below."}
                                </p>
                            </div>

                            {/* Video Section */}
                            <div className="w-full flex flex-col gap-4">
                                {workspaceData?.isFallback && !(
                                    !(activeChapter.youtubeVideoId || workspaceData?.youtubeVideoId) ||
                                    (activeChapter.youtubeVideoId || workspaceData?.youtubeVideoId) === "No suitable video found"
                                ) && (
                                    <div className="p-4 bg-amber-50 wobbly-border border-amber-400 text-amber-800 font-sans text-sm font-semibold flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>{workspaceData.fallbackMessage || `We couldn't find a high-quality video in the requested language. Showing the best English alternative.`}</span>
                                    </div>
                                )}

                                <div className="w-full wobbly-border hard-shadow-sm bg-black overflow-hidden flex items-center justify-center relative" style={{ aspectRatio: "16/9" }}>
                                    {workspaceLoading ? (
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                                            <span className="text-white/50 font-sans text-center text-sm">Fetching video...</span>
                                        </div>
                                    ) : (
                                        !(activeChapter.youtubeVideoId || workspaceData?.youtubeVideoId) ||
                                        (activeChapter.youtubeVideoId || workspaceData?.youtubeVideoId) === "No suitable video found"
                                    ) ? (
                                        <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full bg-slate-900 text-white relative">
                                            <div className="bg-red-500/10 border-2 border-dashed border-red-500 text-red-400 p-6 wobbly-border max-w-md mx-auto">
                                                <span className="text-3xl block mb-2">⚠️</span>
                                                <h3 className="font-display font-black text-lg uppercase tracking-wide">No suitable video found</h3>
                                                <p className="text-xs font-sans mt-2 text-slate-300 leading-relaxed">
                                                    We couldn't find a high-quality video matching this chapter's exact framework and learning objective.
                                                </p>
                                            </div>
                                            
                                            {workspaceData?.alternativeVideos && workspaceData.alternativeVideos.length > 0 && (
                                                <div className="mt-4 w-full max-w-lg">
                                                    <span className="text-xs text-slate-400 block mb-2 font-sans font-bold">
                                                        You can try one of these close matches:
                                                    </span>
                                                    <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto p-1">
                                                        {workspaceData.alternativeVideos.map((alt: any) => (
                                                            <button
                                                                key={alt.videoId}
                                                                disabled={swappingVideo}
                                                                onClick={() => handleSwapVideo(alt.videoId)}
                                                                className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 transition-all font-sans text-xs wobbly-border border-slate-700 cursor-pointer disabled:opacity-50 line-clamp-1 max-w-[200px]"
                                                                title={alt.title}
                                                            >
                                                                {alt.title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <YouTubePlayer 
                                            videoId={activeChapter.youtubeVideoId || workspaceData?.youtubeVideoId} 
                                            onPlayerReady={setYtPlayer} 
                                        />
                                    )}
                                </div>

                                {workspaceData && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 wobbly-border p-3 border-dashed border-2 border-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-display font-black uppercase bg-sketch-primary/10 text-sketch-primary px-2.5 py-1 wobbly-border border-sketch-primary/30">
                                                📹 Video Language: {workspaceData.videoLanguage || "English"}
                                            </span>
                                        </div>
                                        
                                        {workspaceData.alternativeVideos && workspaceData.alternativeVideos.length > 0 && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowAltDropdown(!showAltDropdown)}
                                                    className="px-3 py-1.5 bg-white wobbly-border hover:bg-slate-50 transition-all font-display text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    ✨ Show Alternative Videos ({workspaceData.alternativeVideos.length})
                                                </button>
                                                
                                                {showAltDropdown && (
                                                    <div className="absolute right-0 bottom-full mb-2 w-80 bg-white wobbly-border border-2 border-black hard-shadow p-3 z-50 flex flex-col gap-2 max-h-60 overflow-y-auto">
                                                        <h4 className="font-display font-black text-xs text-slate-800 border-b border-dashed border-slate-200 pb-1.5 uppercase tracking-wide">
                                                            Select Alternative Video
                                                        </h4>
                                                        {workspaceData.alternativeVideos.map((alt: any) => (
                                                            <button
                                                                key={alt.videoId}
                                                                disabled={swappingVideo}
                                                                onClick={() => handleSwapVideo(alt.videoId)}
                                                                className="text-left w-full p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex flex-col gap-1 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <span className="font-display font-bold text-xs text-slate-800 line-clamp-1">
                                                                    {alt.title}
                                                                </span>
                                                                <div className="flex items-center justify-between text-[10px] font-sans text-slate-500 font-semibold w-full">
                                                                    <span>👤 {alt.channelTitle || "YouTube Channel"}</span>
                                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">
                                                                        {alt.language}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {workspaceLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-sketch-primary" />
                                    <span className="font-sans italic text-slate-500 font-semibold">Generating AI Summary, Code Examples & Recall cards...</span>
                                </div>
                            ) : workspaceData ? (
                                <div className="flex flex-col gap-8 mt-8 animate-fade-in">
                                    
                                    {/* 1. Summary */}
                                    <div className="p-5 bg-amber-50/10 wobbly-border border-dashed border-2 border-amber-300">
                                        <h3 className="font-display text-xl font-black text-amber-800 mb-3 flex items-center gap-2">
                                            📖 Chapter Summary
                                        </h3>
                                        <p className="font-sans text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                                            {workspaceData.summary}
                                        </p>
                                    </div>

                                    {/* 2. Key Concepts badges */}
                                    {workspaceData.concepts && workspaceData.concepts.length > 0 && (
                                        <div className="flex flex-col gap-3">
                                            <h3 className="font-display text-lg font-black text-slate-900 pl-1">
                                                🧠 Key Concepts in this Lesson
                                            </h3>
                                            <div className="flex flex-wrap gap-2.5">
                                                {workspaceData.concepts.map((concept: any) => {
                                                    let statusColor = "bg-slate-50 text-slate-500 border-slate-200";
                                                    if (concept.status === "Mastered") {
                                                        statusColor = "bg-green-50 text-green-700 border-green-300";
                                                    } else if (concept.status === "Needs Review") {
                                                        statusColor = "bg-amber-50 text-amber-700 border-amber-300";
                                                    } else if (concept.status === "Ready to Learn") {
                                                        statusColor = "bg-blue-50 text-blue-700 border-blue-300";
                                                    }

                                                    return (
                                                        <button
                                                            key={concept.id}
                                                            onClick={() => {
                                                                setSelectedConceptId(concept.id);
                                                                setIsConceptDrawerOpen(true);
                                                            }}
                                                            className={`px-3 py-1.5 wobbly-border text-xs font-display font-bold hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 border-2 ${statusColor}`}
                                                        >
                                                            {concept.status === "Mastered" && "✓ "}
                                                            {concept.status === "Needs Review" && "⚠ "}
                                                            {concept.name}
                                                            <span className="text-[10px] font-sans opacity-60">({concept.masteryScore}%)</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Worked Examples */}
                                    {workspaceData.workedExamples && workspaceData.workedExamples.length > 0 && (
                                        <div className="flex flex-col gap-4">
                                            <h3 className="font-display text-xl font-black text-slate-900 flex items-center gap-2 pl-1">
                                                <Code2 className="w-5 h-5 text-sketch-primary" /> Worked Coding Examples
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                {workspaceData.workedExamples.map((ex: any, idx: number) => (
                                                    <div key={idx} className="p-5 wobbly-border border border-slate-200 bg-[#fafafa]">
                                                        <h4 className="font-display text-base font-bold text-slate-800 mb-3 underline decoration-sketch-orange decoration-2">
                                                            Example {idx + 1}: {ex.title}
                                                        </h4>
                                                        {ex.code && (
                                                            <pre className="p-4 bg-slate-900 text-emerald-400 wobbly-border text-xs font-mono overflow-x-auto leading-relaxed shadow-inner">
                                                                <code>{ex.code}</code>
                                                            </pre>
                                                        )}
                                                        <p className="font-sans text-slate-600 text-xs mt-3 leading-relaxed whitespace-pre-wrap">
                                                            {ex.explanation}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Revision Schedule Status */}
                                    {workspaceData.revisionStatus && (
                                        <div className="p-4 bg-purple-50/30 wobbly-border border-dashed border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <Calendar className="w-4 h-4 text-sketch-primary shrink-0" />
                                                <div>
                                                    <p className="font-bold text-slate-800">Spaced Repetition Loop Activated</p>
                                                    <p className="text-slate-500 mt-0.5">
                                                        Stage {workspaceData.revisionStatus.reviewNumber} scheduled for: {" "}
                                                        {new Date(workspaceData.revisionStatus.scheduledAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-0.5 font-bold uppercase tracking-wider wobbly-border border-2 text-[10px] ${
                                                workspaceData.revisionStatus.status === "MISSED"
                                                    ? "bg-red-50 text-red-600 border-red-200"
                                                    : "bg-purple-100 text-sketch-primary border-purple-300"
                                            }`}>
                                                {workspaceData.revisionStatus.status}
                                            </span>
                                        </div>
                                    )}

                                    {/* 5. Quick Recall Questions (Inline Spaced Repetition) */}
                                    {workspaceData.recallQuestions && workspaceData.recallQuestions.length > 0 && (
                                        <div className="p-6 bg-slate-50/50 wobbly-border border-2 border-dashed border-slate-300 flex flex-col gap-4 relative">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
                                                    <BrainCircuit className="w-5 h-5 text-sketch-primary animate-pulse" />
                                                    Quick Recall Flashcards
                                                </h3>
                                                <span className="font-sans text-xs text-slate-400">
                                                    Card {recallIdx + 1} of {workspaceData.recallQuestions.length}
                                                </span>
                                            </div>

                                            {/* Flashcard container */}
                                            <div className="min-h-[160px] bg-white wobbly-border p-6 flex flex-col justify-between relative shadow-sm border border-slate-200 overflow-hidden">
                                                <div className="flex-1 flex flex-col justify-center">
                                                    {!isFlipped ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                                                                Question ({workspaceData.recallQuestions[recallIdx].type})
                                                            </span>
                                                            <p className="font-display text-lg font-bold text-slate-800 leading-snug">
                                                                {workspaceData.recallQuestions[recallIdx].question}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-green-500">
                                                                Answer Explanation
                                                            </span>
                                                            <p className="font-sans text-slate-700 text-sm font-medium leading-relaxed">
                                                                {workspaceData.recallQuestions[recallIdx].answer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-100 shrink-0">
                                                    {!isFlipped ? (
                                                        <button
                                                            onClick={() => setIsFlipped(true)}
                                                            className="px-4 py-1.5 bg-black text-white wobbly-border font-display text-xs hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer shadow-sm"
                                                        >
                                                            Reveal Answer 👀
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-sans font-bold text-slate-400 mr-2">Rate recall difficulty:</span>
                                                            {['HARD', 'MEDIUM', 'EASY'].map((rating) => (
                                                                <button
                                                                    key={rating}
                                                                    disabled={ratingLoading}
                                                                    onClick={() => handleRecallRating(rating as any)}
                                                                    className={`px-3 py-1.5 wobbly-border font-display text-xs font-bold hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer ${
                                                                        rating === 'EASY' ? 'bg-green-100 text-green-700 border-green-400' :
                                                                        rating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-400' :
                                                                        'bg-red-100 text-red-700 border-red-400'
                                                                    }`}
                                                                >
                                                                    {rating}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Notes Panel */}
                                    <div className="border-t-2 border-dashed border-slate-100 pt-6">
                                        <h3 className="font-display text-xl font-bold text-slate-900 mb-3 pl-1">
                                            📝 Lesson Notebook & Annotator
                                        </h3>
                                        <NotesPanel 
                                            courseId={course.courseId} 
                                            chapterId={activeChapter.chapterId} 
                                            ytPlayer={ytPlayer} 
                                        />
                                    </div>

                                    {/* 7. QuizCard */}
                                    <div className="border-t-2 border-dashed border-slate-100 pt-6">
                                        <QuizCard
                                            courseId={course.courseId}
                                            chapterId={activeChapter.chapterId}
                                            chapterTitle={activeChapter.chapterTitle}
                                            subContent={(activeChapter.videoContent as any)?.subContent || []}
                                        />
                                    </div>

                                    {/* 8. Related Concepts */}
                                    {workspaceData.relatedConcepts && workspaceData.relatedConcepts.length > 0 && (
                                        <div className="flex flex-col gap-3 pt-6 border-t-2 border-dashed border-slate-100">
                                            <h4 className="font-display text-sm font-bold text-slate-500 pl-1 uppercase tracking-wider">
                                                🌳 Related Concepts to Explore
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {workspaceData.relatedConcepts.map((concept: any) => (
                                                    <button
                                                        key={concept.id}
                                                        onClick={() => {
                                                            setSelectedConceptId(concept.id);
                                                            setIsConceptDrawerOpen(true);
                                                        }}
                                                        className="px-3 py-1 bg-white hover:bg-slate-50 wobbly-border border border-slate-200 text-xs font-display font-bold text-slate-700 cursor-pointer"
                                                    >
                                                        {concept.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 9. Chapter Tracker */}
                                    <div className="pt-6 border-t-2 border-dashed border-slate-100">
                                        <ChapterProgressTracker
                                            courseId={course.courseId}
                                            chapterId={activeChapter.chapterId}
                                            initialProgress={activeProgress?.progressPercentage || 0}
                                            initialStatus={activeProgress?.status || 'NOT_STARTED'}
                                            onProgressChange={handleProgressChange}
                                        />
                                    </div>

                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="p-10 wobbly-border text-center bg-white hard-shadow italic font-display text-xl text-slate-400">
                            No chapter selected. Click on a roadmap node on the left to begin learning.
                        </div>
                    )}
                </div>
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
