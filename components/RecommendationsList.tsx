"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Sparkles, Star, Layers, Play, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function RecommendationsList() {
    const { user, isLoaded } = useUser();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchRecommendations();
        }
    }, [user]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/recommendations");
            const data = res.data;
            
            // Prefer hybrid finalRecommendations, fallback to popular if empty
            const recList = data.finalRecommendations?.length > 0 
                ? data.finalRecommendations 
                : data.popular?.map((p: any) => ({
                    course: p.course,
                    score: p.score,
                    reason: p.reason || "Trending this week.",
                    popularityScore: p.score
                })) || [];
                
            setRecommendations(recList.slice(0, 4));

            // Log VIEWED events for the rendered recommendations without duplicate tracking
            if (recList.length > 0) {
                const sessionUserId = user?.id || "anonymous";
                const viewedKey = `viewed-courses-${sessionUserId}`;
                let viewedCourses: string[] = [];
                try {
                    viewedCourses = JSON.parse(sessionStorage.getItem(viewedKey) || "[]");
                } catch (err) {
                    viewedCourses = [];
                }
                const viewedSet = new Set(viewedCourses);

                recList.slice(0, 4).forEach((rec: any) => {
                    const cid = rec.course.courseId;
                    if (!viewedSet.has(cid)) {
                        viewedSet.add(cid);
                        axios.post("/api/recommendations/event", {
                            recommendedCourseId: cid,
                            eventType: "VIEWED"
                        })
                        .then(() => {
                            try {
                                sessionStorage.setItem(viewedKey, JSON.stringify(Array.from(viewedSet)));
                            } catch (err) {
                                console.error(err);
                            }
                        })
                        .catch(err => console.error("Failed to log VIEWED event:", err));
                    }
                });
            }
        } catch (e) {
            console.error("Failed to fetch recommendations:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRecClick = async (courseId: string) => {
        try {
            await axios.post("/api/recommendations/event", {
                recommendedCourseId: courseId,
                eventType: "CLICKED"
            });
        } catch (err) {
            console.error("Failed to log CLICKED event:", err);
        }
    };

    if (!isLoaded || !user) return null;
    if (loading) {
        return (
            <div className="w-full px-6 py-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-sketch-primary" />
                <span className="font-sans italic text-slate-500">Searching your sketch logs for matching guides...</span>
            </div>
        );
    }
    if (recommendations.length === 0) return null;

    return (
        <div className="w-full px-6 py-12 text-center border-t-2 border-dashed border-slate-200 mt-8">
            <div className="flex flex-col items-center justify-center gap-2 mb-10">
                <h2 className="font-display text-4xl font-bold underline decoration-sketch-orange decoration-4 underline-offset-8 inline-block flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-sketch-orange animate-sketchbook-float" />
                    Recommended For You 🎯
                </h2>
                <p className="font-sans text-slate-500 italic mt-1 font-semibold">Sketched recommendations matching your learning path</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 text-left">
                {recommendations.map((rec, index) => {
                    const course = rec.course;
                    const level = course.courseLayout?.level || "Beginner";
                    const totalChapters = course.courseLayout?.totalChapters || course.courseLayout?.chapters?.length || 0;

                    return (
                        <div 
                            key={course.courseId} 
                            className={`relative pt-2 transition-all hover:scale-105 hover:z-20 group ${
                                index % 2 === 0 ? "rotate-1" : "-rotate-1"
                            }`}
                        >
                            {/* Thumbtack Decoration */}
                            <div className="thumbtack absolute top-0 right-1/2 translate-x-1/2 z-20 pointer-events-none"></div>

                            <div className="bg-white wobbly-border hard-shadow-sm p-6 relative overflow-visible flex flex-col justify-between h-full bg-[#fdfaf6]/35 hover:bg-white transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-display text-xl font-bold leading-tight line-clamp-2 pr-2">
                                            {course.courseName}
                                        </h3>
                                        <span className="text-sketch-primary text-xs bg-purple-50 p-1 px-2.5 wobbly-border border-2 font-display uppercase tracking-wider shrink-0">
                                            {level}
                                        </span>
                                    </div>

                                    {/* Chapters Info */}
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-sans">
                                        <Layers className="h-4 w-4 text-sketch-blue" />
                                        <span>{totalChapters} Chapters</span>
                                    </div>

                                    {/* Recommendation Reason Banner */}
                                    <div className="w-full p-2.5 bg-sketch-yellow/20 border-l-4 border-sketch-orange font-sans text-xs text-slate-700 italic rounded-r leading-relaxed">
                                        {rec.reason}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-4 mt-6">
                                    {/* Popularity score star indicator */}
                                    <div className="flex items-center gap-1 text-amber-600 text-xs font-display font-bold">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
                                        <span>Trend: {rec.popularityScore !== undefined ? rec.popularityScore.toFixed(1) : rec.score.toFixed(1)}</span>
                                    </div>
                                    <Link href={`/course/${course.courseId}?ref=recommendation`} onClick={() => handleRecClick(course.courseId)}>
                                        <button className="bg-black text-white px-4 py-1.5 wobbly-border hard-shadow-sm hover:translate-x-0.5 font-display text-sm hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer">
                                            Watch <Play className="w-3.5 h-3.5 fill-white" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
