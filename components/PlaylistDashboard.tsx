"use client"

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
    Loader2, Award, ShieldCheck, AlertTriangle, Sparkles, 
    BookOpen, Layers, RefreshCw, BarChart2, Calendar, HelpCircle,
    BrainCircuit 
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const KnowledgeGraphView = dynamic(() => import("./KnowledgeGraphView"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] flex flex-col items-center justify-center bg-[#fbf9f5] wobbly-border border-2 font-display text-slate-400 italic">
            <Loader2 className="w-6 h-6 animate-spin text-sketch-primary mb-2" />
            Loading playlist knowledge map...
        </div>
    )
});

interface Props {
    courseId: string;
    chapters: any[];
    progressRows: any[];
}

export default function PlaylistDashboard({ courseId, chapters, progressRows }: Props) {
    const [activeTab, setActiveTab] = useState<'metrics' | 'graph' | 'flashcards'>('metrics');
    
    // Graph states
    const [graphLoading, setGraphLoading] = useState(false);
    const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
    
    // Flashcard states
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [currentCardIdx, setCurrentCardIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [ratingLoading, setRatingLoading] = useState(false);

    // TODO: Re-enable in future release
    /*
    useEffect(() => {
        if (activeTab === 'graph') {
            loadGraph();
        } else if (activeTab === 'flashcards') {
            loadFlashcards();
        }
    }, [activeTab]);
    */

    // TODO: Re-enable in future release
    /*
    const loadGraph = async () => {
        setGraphLoading(true);
        try {
            const res = await axios.get(`/api/playlist/graph?courseId=${courseId}`);
            setGraphData(res.data);
        } catch (err) {
            console.error("Failed to load playlist graph:", err);
            toast.error("Failed to load knowledge graph.");
        } finally {
            setGraphLoading(false);
        }
    };

    const loadFlashcards = async () => {
        setCardsLoading(true);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        try {
            const res = await axios.get(`/api/playlist/flashcards?courseId=${courseId}`);
            setFlashcards(res.data);
        } catch (err) {
            console.error("Failed to load flashcards:", err);
            toast.error("Failed to load flashcards.");
        } finally {
            setCardsLoading(false);
        }
    };

    const handleRateCard = async (rating: 'EASY' | 'MEDIUM' | 'HARD') => {
        if (flashcards.length === 0) return;
        const card = flashcards[currentCardIdx];
        setRatingLoading(true);
        try {
            await axios.post("/api/playlist/flashcards", {
                flashcardId: card.id,
                rating
            });
            toast.success(`Logged review rating: ${rating}`);
            
            // Advance or reset flip
            setIsFlipped(false);
            if (currentCardIdx < flashcards.length - 1) {
                setCurrentCardIdx(prev => prev + 1);
            } else {
                setCurrentCardIdx(0);
                toast.success("Completed all playlist flashcards! 🎉");
            }
            
            // Refresh list quietly
            const res = await axios.get(`/api/playlist/flashcards?courseId=${courseId}`);
            setFlashcards(res.data);
        } catch (err) {
            console.error("Failed to rate flashcard:", err);
            toast.error("Failed to save flashcard rating.");
        } finally {
            setRatingLoading(false);
        }
    };
    */

    // Calculate metrics
    const totalChapters = chapters.length;
    const completedChapters = progressRows.filter(p => p.status === 'COMPLETED').length;
    const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    
    // Knowledge coverage and revision readiness metrics
    const masteredConcepts = graphData.nodes?.filter(n => n.masteryScore >= 70).length || 0;
    const totalConcepts = graphData.nodes?.length || 0;
    const knowledgeCoverage = totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0;

    return (
        <div className="w-full flex flex-col gap-6 mt-10 border-t-4 border-dashed border-slate-200 pt-8">
            {/* Header */}
            <div className="flex flex-col gap-1 text-left">
                <span className="font-display text-xs tracking-widest uppercase text-sketch-orange font-bold bg-orange-50 px-2.5 py-1 wobbly-border border self-start">
                    Playlist Learning Engine
                </span>
                <h2 className="font-display text-2xl font-black text-slate-800 leading-tight mt-2">
                    Premium Playlist Course Dashboard
                </h2>
                <p className="font-sans text-xs text-slate-500 italic mt-0.5">
                    Explore knowledge graph relationships, spaced repetition flashcards, and interactive metrics generated from your imported video playlist.
                </p>
            </div>

            {/* Dashboard Tabs */}
            <div className="grid grid-cols-1 gap-2 max-w-xs">
                {[
                    { id: 'metrics', label: 'Dashboard & Metrics', icon: <BarChart2 className="w-4 h-4" /> },
                    // TODO: Re-enable in future release
                    // { id: 'graph', label: 'Playlist Graph', icon: <Layers className="w-4 h-4" /> },
                    // { id: 'flashcards', label: 'SRS Flashcards', icon: <BrainCircuit className="w-4 h-4" /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`py-2 px-1.5 flex items-center justify-center gap-1.5 wobbly-border border-2 text-xs font-display font-bold transition-all cursor-pointer ${
                            activeTab === t.id 
                                ? 'bg-slate-900 text-white border-slate-950 scale-102' 
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="w-full wobbly-border border-2 bg-white p-6 relative min-h-[300px] flex flex-col justify-start">
                <div className="thumbtack absolute -top-3 left-10 pointer-events-none"></div>

                {activeTab === 'metrics' && (
                    <div className="flex flex-col gap-6 animate-fade-in text-left">
                        <h3 className="font-display text-xl font-bold text-slate-800 border-b border-dashed pb-2">
                            📊 Course Engagement & Progress
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Videos Completed */}
                            <div className="p-4 bg-slate-50 wobbly-border border flex flex-col gap-1">
                                <span className="font-sans text-xs text-slate-400 font-bold uppercase">Videos Completed</span>
                                <span className="font-display text-2xl font-black text-slate-800">
                                    {completedChapters} / {totalChapters}
                                </span>
                                <span className="font-sans text-[10px] text-slate-500">
                                    {completionPercentage}% complete
                                </span>
                            </div>

                            {/* Modules Completed */}
                            <div className="p-4 bg-slate-50 wobbly-border border flex flex-col gap-1">
                                <span className="font-sans text-xs text-slate-400 font-bold uppercase">Modules Completed</span>
                                <span className="font-display text-2xl font-black text-slate-800">
                                    {Math.ceil(completedChapters / Math.max(1, Math.round(totalChapters / 3)))}
                                </span>
                                <span className="font-sans text-[10px] text-slate-500">
                                    Curriculum progression
                                </span>
                            </div>

                            {/* TODO: Re-enable in future release */}
                            {/* <div className="p-4 bg-slate-50 wobbly-border border flex flex-col gap-1">
                                <span className="font-sans text-xs text-slate-400 font-bold uppercase">Revision Readiness</span>
                                <span className="font-display text-2xl font-black text-emerald-600">
                                    {completionPercentage > 0 ? "85%" : "Ready"}
                                </span>
                                <span className="font-sans text-[10px] text-slate-500">
                                    Comfort levels optimized
                                </span>
                            </div> */}

                            {/* Streak */}
                            <div className="p-4 bg-slate-50 wobbly-border border flex flex-col gap-1">
                                <span className="font-sans text-xs text-slate-400 font-bold uppercase">Learning Streak</span>
                                <span className="font-display text-2xl font-black text-orange-500">
                                    🔥 3 Days
                                </span>
                                <span className="font-sans text-[10px] text-slate-500">
                                    Keep the streak alive!
                                </span>
                            </div>
                        </div>

                        {/* Comparative Section explaining why Coursa playlist learning is better */}
                        <div className="p-4 bg-sketch-yellow/10 wobbly-border border-2 border-sketch-primary mt-4 flex flex-col gap-2">
                            <h4 className="font-display font-bold text-base text-slate-900">
                                Why is Coursa Playlist Learning better?
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 font-sans text-xs text-slate-700">
                                <div className="flex flex-col gap-1.5 border-r border-dashed border-slate-200 pr-2">
                                    <span className="font-bold text-slate-900">• Topic-specific Modules:</span>
                                    <span>We group random, unstructured videos into structured lessons with logical prerequisites.</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="font-bold text-slate-900">• Spaced Repetition Integration:</span>
                                    <span>Unlike YouTube, we generate study cards directly from video transcripts to lock learning into your long term memory.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TODO: Re-enable in future release */}
                {/* {activeTab === 'graph' && ( ... )} */}
                {/* {activeTab === 'flashcards' && ( ... )} */}
            </div>
        </div>
    );
}
