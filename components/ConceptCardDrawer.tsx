"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, X, BookOpen, HelpCircle, AlertTriangle, ShieldCheck, ArrowRight, GitPullRequest } from "lucide-react";

type Props = {
    conceptId: string | null;
    isOpen: boolean;
    onClose: () => void;
};

const ConceptCardDrawer = React.memo(function ConceptCardDrawer({ conceptId, isOpen, onClose }: Props) {
    const [activeId, setActiveId] = useState<string | null>(conceptId);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        setActiveId(conceptId);
    }, [conceptId]);

    useEffect(() => {
        if (activeId && isOpen) {
            fetchConceptDetails(activeId);
        } else {
            setData(null);
        }
    }, [activeId, isOpen]);

    const fetchConceptDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/concepts/${id}`);
            setData(res.data);
        } catch (e) {
            console.error("Failed to fetch concept details in drawer", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Drawer Pane */}
            <div className="relative w-full max-w-lg md:max-w-xl h-full bg-[#faf8f5] wobbly-border-left border-l-4 border-black hard-shadow flex flex-col z-10 transition-transform duration-300 transform translate-x-0 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#faf8f5] border-b-2 border-dashed border-slate-200 p-6 flex justify-between items-center z-20">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-display font-bold uppercase tracking-wider text-sketch-primary border bg-purple-50 px-2 py-0.5 wobbly-border w-fit">
                            {data?.concept?.category || "Concept Encyclopedia"}
                        </span>
                        <h2 className="font-display text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-sketch-orange shrink-0" />
                            {data?.concept?.name || activeId}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 wobbly-border bg-white hover:bg-slate-50 transition-colors hard-shadow-sm cursor-pointer"
                    >
                        <X className="w-5 h-5 text-slate-700" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-sketch-primary" />
                            <span className="font-sans italic text-slate-500 font-semibold">Flipping pages...</span>
                        </div>
                    ) : data ? (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            {/* Definition */}
                            <div className="p-5 bg-white wobbly-border border border-slate-200">
                                <h3 className="font-display text-lg font-black text-slate-800 mb-2 border-b border-dashed border-slate-100 pb-1">
                                    📖 Concept Definition
                                </h3>
                                <p className="font-sans text-slate-700 leading-relaxed text-sm font-medium">
                                    {data.concept.description}
                                </p>
                            </div>

                            {/* Why It Matters */}
                            {data.concept.whyItMatters && (
                                <div className="p-5 bg-emerald-50/10 wobbly-border border-2 border-emerald-500/30">
                                    <h3 className="font-display text-lg font-black text-emerald-800 mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" /> Why It Matters
                                    </h3>
                                    <p className="font-sans text-slate-700 leading-relaxed text-sm font-medium">
                                        {data.concept.whyItMatters}
                                    </p>
                                </div>
                            )}

                            {/* Common Mistakes */}
                            {data.concept.commonMistakes && (
                                <div className="p-5 bg-red-50/10 wobbly-border border-2 border-red-500/30">
                                    <h3 className="font-display text-lg font-black text-red-800 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" /> Common Mistakes
                                    </h3>
                                    <p className="font-sans text-slate-700 leading-relaxed text-sm font-medium">
                                        {data.concept.commonMistakes}
                                    </p>
                                </div>
                            )}

                            {/* Real World Applications */}
                            {data.concept.realWorldApps && (
                                <div className="p-5 bg-blue-50/10 wobbly-border border-2 border-blue-500/30">
                                    <h3 className="font-display text-lg font-black text-blue-800 mb-2 flex items-center gap-2">
                                        <HelpCircle className="w-5 h-5 text-blue-500" /> Real-World Applications
                                    </h3>
                                    <p className="font-sans text-slate-700 leading-relaxed text-sm font-medium">
                                        {data.concept.realWorldApps}
                                    </p>
                                </div>
                            )}

                            {/* Relationship Mapping */}
                            <div className="flex flex-col gap-4 border-t-2 border-dashed border-slate-200 pt-6">
                                <h3 className="font-display text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <GitPullRequest className="w-5 h-5 text-sketch-primary" /> Concept Web Connections
                                </h3>

                                {/* Prerequisites */}
                                <div>
                                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Prerequisites</h4>
                                    {data.prerequisites.length === 0 ? (
                                        <p className="text-slate-400 font-sans text-xs italic">No prerequisites required.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {data.prerequisites.map((pr: any) => (
                                                <button
                                                    key={pr.id}
                                                    onClick={() => setActiveId(pr.id)}
                                                    className="px-3 py-1.5 bg-white wobbly-border hover:bg-sketch-primary/5 transition-colors font-display font-bold text-xs text-slate-700 hard-shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    {pr.name}
                                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Advanced / Dependent Topics */}
                                <div>
                                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Advanced Topics Unlocked</h4>
                                    {data.advancedTopics.length === 0 && data.usedIn.length === 0 ? (
                                        <p className="text-slate-400 font-sans text-xs italic">No advanced topics mapped.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {[...data.advancedTopics, ...data.usedIn].filter(Boolean).map((adv: any) => (
                                                <button
                                                    key={adv.id}
                                                    onClick={() => setActiveId(adv.id)}
                                                    className="px-3 py-1.5 bg-white wobbly-border hover:bg-sketch-primary/5 transition-colors font-display font-bold text-xs text-slate-700 hard-shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    {adv.name}
                                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Related Concepts */}
                                <div>
                                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Related Topics</h4>
                                    {data.related.length === 0 ? (
                                        <p className="text-slate-400 font-sans text-xs italic">No related concepts mapped.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {data.related.map((rel: any) => (
                                                <button
                                                    key={rel.id}
                                                    onClick={() => setActiveId(rel.id)}
                                                    className="px-3 py-1.5 bg-white wobbly-border hover:bg-sketch-primary/5 transition-colors font-display font-bold text-xs text-slate-700 hard-shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    {rel.name}
                                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center italic text-slate-400 py-10 font-sans">No data retrieved for this concept.</div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ConceptCardDrawer;
