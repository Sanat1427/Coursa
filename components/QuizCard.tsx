"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, HelpCircle, Check, X, Award, RotateCcw, Play } from "lucide-react";
import { Quiz, Question, QuizAttempt } from "@/types/CourseType";

type Props = {
    courseId: string;
    chapterId: string;
    chapterTitle: string;
    subContent: string[];
};

export default function QuizCard({ courseId, chapterId, chapterTitle, subContent }: Props) {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [stats, setStats] = useState<{ totalAttempts: number; highestScore: number; latestScore: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Quiz taking state
    const [active, setActive] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    
    // Results state
    const [submitting, setSubmitting] = useState(false);
    const [latestAttempt, setLatestAttempt] = useState<(QuizAttempt & { gradedAnswers: any[] }) | null>(null);

    useEffect(() => {
        fetchQuizDetails();
    }, [chapterId]);

    const fetchQuizDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/quiz?chapterId=${chapterId}`);
            if (res.data && res.data.length > 0) {
                const quizData = res.data[0];
                setQuiz(quizData);
                await fetchStats(quizData.quizId);
            } else {
                setQuiz(null);
            }
        } catch (e) {
            console.error("Failed to load quiz details", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (qId: string) => {
        try {
            const statsRes = await axios.get(`/api/quiz/attempt?quizId=${qId}`);
            setStats(statsRes.data);
        } catch (e) {
            console.error("Failed to load quiz stats", e);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        const toastId = toast.loading("Drafting quiz questions...");
        try {
            const res = await axios.post("/api/quiz", {
                courseId,
                chapterId,
                chapterTitle,
                subContent,
            });
            toast.success("AI Quiz generated successfully!", { id: toastId });
            setQuiz(res.data);
            await fetchStats(res.data.quizId);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to generate quiz", { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    const handleAnswerSelect = (qId: string, ans: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [qId]: ans,
        }));
    };

    const handleSubmit = async () => {
        if (!quiz) return;
        
        // Ensure all questions are answered
        const questionsList = quiz.questions || [];
        const unanswered = questionsList.filter(q => !selectedAnswers[q.questionId]);
        if (unanswered.length > 0) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Grading your answers...");
        try {
            const payloadAnswers = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
                questionId,
                selectedAnswer,
            }));
            
            const res = await axios.post("/api/quiz/attempt", {
                quizId: quiz.quizId,
                answers: payloadAnswers,
            });
            
            toast.success("Quiz submitted successfully!", { id: toastId });
            setLatestAttempt(res.data);
            setActive(false);
            await fetchStats(quiz.quizId);
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit attempt", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleStart = () => {
        setSelectedAnswers({});
        setCurrentIdx(0);
        setLatestAttempt(null);
        setActive(true);
    };

    const handleReset = () => {
        setSelectedAnswers({});
        setCurrentIdx(0);
        setLatestAttempt(null);
        setActive(false);
    };

    if (loading) {
        return (
            <div className="p-8 wobbly-border border-dashed border-slate-300 text-center bg-slate-50/50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-sketch-primary" />
                <span className="font-display text-lg text-slate-500 italic">Finding practice sheets...</span>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-8 wobbly-border border-dashed border-slate-300 text-center bg-slate-50/50 flex flex-col items-center justify-center gap-4 mt-8">
                <p className="font-display text-2xl text-slate-500 italic">No practice sheets for this lesson yet.</p>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-6 py-3 bg-sketch-primary text-white font-display text-xl wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Drafting Quiz...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 text-sketch-yellow fill-sketch-yellow" />
                            <span>Generate AI Quiz</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    const questions = quiz.questions || [];
    const currentQuestion = questions[currentIdx];

    return (
        <div className="mt-8 p-6 md:p-8 wobbly-border bg-white hard-shadow relative">
            <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-20"></div>
            
            {/* Header / Stats View */}
            {!active && !latestAttempt && (
                <div className="flex flex-col gap-6 text-center md:text-left">
                    <div className="flex flex-col gap-2">
                        <span className="flex items-center justify-center md:justify-start gap-2 p-1.5 px-3 wobbly-border border bg-sketch-yellow/10 text-slate-800 font-sans font-medium w-fit rotate-[-1deg] text-sm">
                            🧠 Chapter Quiz
                        </span>
                        <h3 className="font-display text-3xl font-bold text-slate-900 mt-2">{quiz.title}</h3>
                        <p className="font-sans text-slate-600 text-lg">{quiz.description}</p>
                    </div>

                    {stats && stats.totalAttempts > 0 && (
                        <div className="grid grid-cols-3 gap-4 p-4 wobbly-border border-dashed border-2 bg-slate-50/50 font-display text-center">
                            <div>
                                <p className="text-slate-500 text-sm font-sans">Attempts</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAttempts}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-sans">Highest Score</p>
                                <p className="text-2xl font-bold text-sketch-primary mt-1">{stats.highestScore}%</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-sans">Latest Score</p>
                                <p className="text-2xl font-bold text-sketch-orange mt-1">{stats.latestScore}%</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        className="w-full bg-sketch-primary text-white font-display text-2xl py-4 wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Play className="w-5 h-5 fill-white" />
                        <span>{stats && stats.totalAttempts > 0 ? "Retake Practice Quiz" : "Start Practice Quiz"}</span>
                    </button>
                </div>
            )}

            {/* Quiz Active View */}
            {active && currentQuestion && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
                        <span className="font-display text-lg text-slate-500">
                            Question {currentIdx + 1} of {questions.length}
                        </span>
                        <button 
                            onClick={handleReset}
                            className="font-display text-sm text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="font-display text-2xl font-bold text-slate-900 flex items-start gap-2">
                            <HelpCircle className="w-6 h-6 text-sketch-blue shrink-0 mt-1" />
                            {currentQuestion.questionText}
                        </h4>
                        
                        <div className="flex flex-col gap-3 mt-4">
                            {currentQuestion.type === "MULTIPLE_CHOICE" && Array.isArray(currentQuestion.options) ? (
                                currentQuestion.options.map((option: string, i: number) => {
                                    const isSelected = selectedAnswers[currentQuestion.questionId] === option;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswerSelect(currentQuestion.questionId, option)}
                                            className={`w-full text-left p-4 wobbly-border font-sans text-lg transition-all hover:bg-slate-50 cursor-pointer ${
                                                isSelected 
                                                    ? "border-sketch-primary bg-purple-50 text-sketch-primary font-medium border-2 scale-[1.01]" 
                                                    : "bg-white text-slate-700"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })
                            ) : (
                                ["True", "False"].map((option, i) => {
                                    const isSelected = selectedAnswers[currentQuestion.questionId] === option;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswerSelect(currentQuestion.questionId, option)}
                                            className={`w-full text-left p-4 wobbly-border font-sans text-lg transition-all hover:bg-slate-50 cursor-pointer ${
                                                isSelected 
                                                    ? "border-sketch-primary bg-purple-50 text-sketch-primary font-medium border-2 scale-[1.01]" 
                                                    : "bg-white text-slate-700"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-6 mt-4">
                        <button
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(prev => prev - 1)}
                            className="px-5 py-2.5 wobbly-border bg-white text-slate-700 disabled:opacity-30 hover:bg-slate-50 font-display text-lg cursor-pointer"
                        >
                            Previous
                        </button>
                        
                        {currentIdx < questions.length - 1 ? (
                            <button
                                disabled={!selectedAnswers[currentQuestion.questionId]}
                                onClick={() => setCurrentIdx(prev => prev + 1)}
                                className="px-6 py-2.5 wobbly-border bg-black text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 font-display text-lg cursor-pointer"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                disabled={submitting || !selectedAnswers[currentQuestion.questionId]}
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-sketch-primary text-white font-display text-xl wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Quiz"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Quiz Results View */}
            {latestAttempt && (
                <div className="flex flex-col gap-6">
                    <div className="text-center p-6 wobbly-border border-2 border-sketch-primary bg-purple-50/50 flex flex-col items-center gap-3">
                        <Award className="w-16 h-16 text-sketch-primary animate-bounce" />
                        <h4 className="font-display text-3xl font-bold text-slate-900">Quiz Completed!</h4>
                        <p className="font-sans text-slate-600 text-lg">
                            You scored <span className="font-bold text-sketch-primary">{latestAttempt.score} / {latestAttempt.totalQuestions}</span> correct ({latestAttempt.percentage}%)
                        </p>
                        <div className="w-48 h-4 bg-slate-100 wobbly-border overflow-hidden relative mt-2">
                            <div 
                                className="h-full bg-sketch-primary transition-all"
                                style={{ width: `${latestAttempt.percentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 mt-4">
                        <h5 className="font-display text-2xl font-bold text-slate-800">Result Breakdown</h5>
                        
                        {latestAttempt.gradedAnswers.map((ans, i) => {
                            const question = questions.find(q => q.questionId === ans.questionId);
                            if (!question) return null;
                            
                            return (
                                <div 
                                    key={i} 
                                    className={`p-5 wobbly-border border-dashed border-2 flex flex-col gap-3 ${
                                        ans.isCorrect ? "bg-green-50/40 border-green-300" : "bg-red-50/40 border-red-300"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <h6 className="font-display text-xl font-bold text-slate-800 leading-snug">
                                            {i + 1}. {question.questionText}
                                        </h6>
                                        <span className={`p-1 wobbly-border flex shrink-0 ${
                                            ans.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                            {ans.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </span>
                                    </div>
                                    
                                    <div className="font-sans text-sm text-slate-600 flex flex-col gap-1 mt-1">
                                        <p>
                                            <span className="font-medium text-slate-700">Your Answer:</span> {ans.selectedAnswer || <span className="italic text-slate-400">None</span>}
                                        </p>
                                        {!ans.isCorrect && (
                                            <p>
                                                <span className="font-medium text-green-700">Correct Answer:</span> {ans.correctAnswer}
                                            </p>
                                        )}
                                        {question.explanation && (
                                            <p className="mt-2 text-xs italic bg-white/60 p-3 wobbly-border border-slate-200">
                                                💡 {question.explanation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center mt-6 border-t border-dashed border-slate-200 pt-6">
                        <button
                            onClick={handleReset}
                            className="px-6 py-2.5 wobbly-border bg-white text-slate-700 hover:bg-slate-50 font-display text-lg cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleStart}
                            className="px-6 py-2.5 wobbly-border bg-sketch-primary text-white hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-display text-lg flex items-center gap-2 cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Retake Quiz</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
