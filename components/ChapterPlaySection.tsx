"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import YouTubePlayer from "./YouTubePlayer";
import NotesPanel from "./NotesPanel";

type Props = {
    courseId: string;
    chapterId: string;
    youtubeVideoId: string | null;
    chapterTitle: string;
};

export default function ChapterPlaySection({ courseId, chapterId, youtubeVideoId, chapterTitle }: Props) {
    const [ytPlayer, setYtPlayer] = useState<any>(null);

    useEffect(() => {
        if (!courseId || !chapterId) return;
        // Call GET endpoint to record a page view for this chapter
        axios.get(`/api/course/progress?courseId=${courseId}&chapterId=${chapterId}`)
            .catch(err => console.error("Failed to record chapter view", err));
    }, [courseId, chapterId]);

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="w-full wobbly-border hard-shadow-sm bg-black overflow-hidden flex items-center justify-center relative" style={{ aspectRatio: "16/9" }}>
                <div className="thumbtack absolute -top-3 left-1/2 -translate-x-1/2 z-20"></div>
                {youtubeVideoId ? (
                    <YouTubePlayer 
                        videoId={youtubeVideoId} 
                        onPlayerReady={setYtPlayer} 
                    />
                ) : (
                    <div className="text-white/50 font-sans text-center text-lg p-4">Video Not Found</div>
                )}
            </div>
            
            <NotesPanel 
                courseId={courseId} 
                chapterId={chapterId} 
                ytPlayer={ytPlayer} 
            />
        </div>
    );
}
