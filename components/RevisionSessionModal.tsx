import React, { useState } from "react";
import { Loader2, X, ArrowRight, HelpCircle, Check, AlertCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Question {
    id: number;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    type: 'DEFINITION' | 'CONCEPT' | 'SCENARIO' | 'TRUE_FALSE';
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chapterTitle: string;
    chapterId: string;
    scheduleId: number;
    questions: Question[];
    onComplete: () => void;
}

export default function RevisionSessionModal({
    isOpen,
    onClose,
    chapterTitle,
    chapterId,
    scheduleId,
    questions = [],
    onComplete
}: Props) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [reveal, setReveal] = useState(false);
    const [phase, setPhase] = useState<'QUESTIONS' | 'RATING'>('QUESTIONS');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const currentQuestion = questions[currentIdx];
    const isLastQuestion = currentIdx === questions.length - 1;

    const handleNext = () => {
        if (isLastQuestion) {
            setPhase('RATING');
        } else {
            setCurrentIdx(prev => prev + 1);
            setReveal(false);
        }
    };

    const handleRate = async (rating: 'EASY' | 'MEDIUM' | 'HARD') => {
        setSubmitting(true);
        try {
            await axios.post("/api/revision/complete", {
                chapterId,
                scheduleId,
                rating
            });
            toast.success("Review logged! Memory Strength updated. 📈");
            onComplete();
            onClose();
        } catch (e: any) {
            console.error("Failed to complete revision:", e);
            toast.error("Failed to save revision progress");
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEFINITION': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'CONCEPT': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'SCENARIO': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'TRUE_FALSE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
            <div className="bg-[#fcfbf9] w-full max-w-2xl wobbly-border hard-shadow p-6 md:p-8 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-black cursor-pointer"
                >
                    <X className="w-6 h-6" />
                </button>

                <div>
                    {/* Header */}
                    <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-6">
                        <span className="text-xs uppercase font-display font-bold tracking-wider text-sketch-primary">Spaced Repetition Review</span>
                        <h2 className="font-display text-2xl font-bold leading-tight mt-1 text-slate-800">
                            {chapterTitle}
                        </h2>
                    </div>

                    {phase === 'QUESTIONS' ? (
                        questions.length === 0 ? (
                            <div className="text-center py-12 italic text-slate-400 font-display text-xl">
                                Preparing revision questions, please retry in a moment...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {/* Progress Indicator */}
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                                    <span>QUESTION {currentIdx + 1} OF {questions.length}</span>
                                    <span className="capitalize">Difficulty: {currentQuestion?.difficulty?.toLowerCase()}</span>
                                </div>

                                {/* Question Panel */}
                                <div className="p-6 bg-white wobbly-border border-2 border-slate-200 min-h-[140px] flex flex-col justify-center">
                                    <div className="flex items-start gap-3">
                                        <span className={`px-2.5 py-0.5 wobbly-border text-[10px] font-bold border ${getTypeColor(currentQuestion?.type)}`}>
                                            {currentQuestion?.type?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="font-display text-xl font-bold text-slate-800 mt-4 leading-relaxed">
                                        {currentQuestion?.question}
                                    </p>
                                </div>

                                {/* Answer Reveal Panel */}
                                {reveal ? (
                                    <div className="p-6 bg-sketch-yellow/15 wobbly-border border-2 border-dashed border-sketch-yellow min-h-[120px] animate-sketchbook-float">
                                        <h4 className="font-display font-bold text-sm text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                            <HelpCircle className="w-4 h-4" /> Explanation / Answer:
                                        </h4>
                                        <p className="text-slate-800 font-sans text-base leading-relaxed">
                                            {currentQuestion?.answer}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setReveal(true)}
                                        className="w-full py-4 bg-sketch-yellow/10 hover:bg-sketch-yellow/20 text-slate-800 wobbly-border border-dashed border-2 border-slate-300 font-display text-lg font-bold transition-all cursor-pointer"
                                    >
                                        👀 Reveal Correct Answer
                                    </button>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-6 flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-100 wobbly-border border-2 border-green-500 flex items-center justify-center text-green-600 mb-6">
                                <Check className="w-8 h-8 stroke-[3]" />
                            </div>
                            <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Revision Pack Complete!</h3>
                            <p className="font-sans text-slate-500 mb-8 max-w-md">
                                How well did you recall and understand the concepts in this chapter? Choose your self-rating to schedule the next review:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                                <button
                                    onClick={() => handleRate('HARD')}
                                    disabled={submitting}
                                    className="p-5 bg-white hover:bg-red-50/50 wobbly-border border-2 border-red-200 hover:border-red-500 transition-colors flex flex-col gap-2 group cursor-pointer"
                                >
                                    <span className="font-display font-bold text-red-600 text-lg flex items-center gap-1.5">
                                        <AlertCircle className="w-5 h-5" /> Incorrect (Hard)
                                    </span>
                                    <span className="text-xs text-slate-500 font-sans leading-relaxed">
                                        Struggled with questions or forgot. Reschedules for tomorrow with a penalty.
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleRate('MEDIUM')}
                                    disabled={submitting}
                                    className="p-5 bg-white hover:bg-blue-50/50 wobbly-border border-2 border-blue-200 hover:border-blue-500 transition-colors flex flex-col gap-2 group cursor-pointer"
                                >
                                    <span className="font-display font-bold text-blue-600 text-lg flex items-center gap-1.5">
                                        <HelpCircle className="w-5 h-5" /> Correct (Medium)
                                    </span>
                                    <span className="text-xs text-slate-500 font-sans leading-relaxed">
                                        Recalled with some effort. Schedules next review in standard Leitner interval.
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleRate('EASY')}
                                    disabled={submitting}
                                    className="p-5 bg-white hover:bg-green-50/50 wobbly-border border-2 border-green-200 hover:border-green-500 transition-colors flex flex-col gap-2 group cursor-pointer"
                                >
                                    <span className="font-display font-bold text-green-600 text-lg flex items-center gap-1.5">
                                        <Check className="w-5 h-5" /> Correct (Easy)
                                    </span>
                                    <span className="text-xs text-slate-500 font-sans leading-relaxed">
                                        Recalled effortlessly! Increases Ease Factor and pushes next review much further.
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                {phase === 'QUESTIONS' && questions.length > 0 && (
                    <div className="flex justify-end mt-8 border-t border-slate-100 pt-4">
                        <button
                            onClick={handleNext}
                            disabled={!reveal}
                            className={`flex items-center gap-2 px-6 py-2.5 wobbly-border hard-shadow-sm font-display text-lg transition-all ${
                                reveal 
                                    ? "bg-black text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer" 
                                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            }`}
                        >
                            {isLastQuestion ? "Finish & Rate" : "Next Question"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
                
                {submitting && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-sketch-primary" />
                    </div>
                )}
            </div>
        </div>
    );
}
