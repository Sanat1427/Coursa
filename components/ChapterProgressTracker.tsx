"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

type Props = {
    courseId: string;
    chapterId: string;
    initialProgress: number;
    initialStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    onProgressChange?: (progressPercentage: number, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => void;
};

const ChapterProgressTracker = React.memo(function ChapterProgressTracker({
    courseId,
    chapterId,
    initialProgress = 0,
    initialStatus = 'NOT_STARTED',
    onProgressChange
}: Props) {
    const router = useRouter();
    const [progress, setProgress] = useState<number>(initialProgress);
    const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>(initialStatus);
    const [loading, setLoading] = useState(false);

    const updateProgressApi = async (percentage: number) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/course/progress", {
                courseId,
                chapterId,
                progressPercentage: percentage,
            });
            const updated = response.data;
            setProgress(updated.progressPercentage);
            setStatus(updated.status);
            if (onProgressChange) {
                onProgressChange(updated.progressPercentage, updated.status);
            }
            router.refresh();
        } catch (error) {
            console.error("Failed to update progress", error);
            toast.error("Failed to save progress");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async () => {
        const nextProgress = status === "COMPLETED" ? 0 : 100;
        await updateProgressApi(nextProgress);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProgress(parseInt(e.target.value, 10));
    };

    const handleSliderRelease = async (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        await updateProgressApi(val);
    };

    return (
        <div className="flex flex-col gap-4 mt-6 p-5 wobbly-border bg-slate-50/50 border-dashed border-2 relative">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleComplete}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 wobbly-border hard-shadow-sm font-display text-lg transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer ${
                            status === "COMPLETED"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-white text-slate-700 hover:bg-sketch-yellow/10"
                        }`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : status === "COMPLETED" ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 fill-green-700 text-green-100" />
                                <span>Completed</span>
                            </>
                        ) : (
                            <>
                                <Circle className="w-5 h-5" />
                                <span>Mark Completed</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="font-display text-lg font-bold text-slate-700">
                    {progress}% Done
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    disabled={loading}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sketch-primary"
                />
                <div className="flex justify-between text-xs font-sans text-slate-400">
                    <span>Not Started</span>
                    <span>In Progress</span>
                    <span>Completed</span>
                </div>
            </div>
        </div>
    );
});

export default ChapterProgressTracker;
