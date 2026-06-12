"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Video, Sparkles, Loader2, Play, BookOpen, 
  Clock, AlertTriangle, HelpCircle, Check, Book 
} from 'lucide-react'
import { createCourseAction } from '@/app/actions/course'
import { toast } from 'sonner'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CreateCoursePage() {
    const router = useRouter();
    const [topic, setTopic] = useState('');
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [mode, setMode] = useState<'topic' | 'playlist' | 'hybrid'>('playlist');
    const [language, setLanguage] = useState('English');
    const [depth, setDepth] = useState('fullcourse');
    
    // Preview states
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Generation states
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/(?:^|; )coursa_lang=([^;]*)/);
            if (match && match[1]) {
                setLanguage(match[1]);
            }
        }
    }, []);

    // Watch playlistUrl to fetch preview
    useEffect(() => {
        if (!playlistUrl) {
            setPreviewData(null);
            setPreviewError(null);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchPreview();
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [playlistUrl]);

    const fetchPreview = async () => {
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);

        try {
            const res = await fetch(`/api/playlist/preview?playlistUrl=${encodeURIComponent(playlistUrl)}`);
            const data = await res.json();

            if (!res.ok) {
                setPreviewError(data.error || "Failed to load playlist preview.");
            } else {
                setPreviewData(data);
                // Auto populate topic/course name if empty
                if (!topic) {
                    setTopic(data.playlistTitle);
                }
            }
        } catch (err) {
            setPreviewError("Network error. Please make sure the URL is valid and you have an active connection.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        if (mode !== 'playlist' && !topic.trim()) {
            toast.error('Please enter a course topic!');
            return;
        }
        if (mode !== 'topic' && !playlistUrl.trim()) {
            toast.error('Please provide a YouTube Playlist URL!');
            return;
        }
        if (mode !== 'topic' && !previewData && !previewError) {
            toast.error('Please wait for the playlist preview to load.');
            return;
        }

        const toastId = toast.loading('Sketching your course layout...');
        const courseId = crypto.randomUUID();
        try {
            setGenerating(true);
            const res = await createCourseAction({
                userInput: mode === 'playlist' ? (previewData?.playlistTitle || topic) : topic,
                type: depth,
                language,
                courseId: courseId,
                playlistId: previewData?.playlistId || playlistUrl,
                mode
            });

            toast.success('Course layout sketched successfully!', { id: toastId });
            router.push('/course/' + res.courseId);
        } catch (e: any) {
            setGenerating(false);
            toast.error(e.message || 'Failed to sketch course layout!', { id: toastId });
        }
    };

    return (
        <main className="min-h-screen bg-[#fdfaf6] py-12 px-6 md:px-12 lg:px-24 dot-pattern">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
                {/* Back Link */}
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 font-display text-lg hover:underline hover:decoration-dashed decoration-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                        Generate A Structured <span className="text-sketch-primary scribble-underline italic">Course</span>
                    </h1>
                    <p className="font-sans text-lg text-slate-700">
                        Choose your generation mode, connect YouTube lectures, and let Coursa construct a comprehensive, structured study curriculum.
                    </p>
                </div>

                {/* Main Config Container */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Left: Input Form */}
                    <div className="md:col-span-7 w-full flex flex-col gap-6">
                        <div className="wobbly-border hard-shadow bg-white p-6 md:p-8 flex flex-col gap-6 relative">
                            <div className="thumbtack absolute -top-3 left-10 z-20"></div>

                            {/* Mode Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="font-display text-lg font-bold">Generation Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['topic', 'playlist', 'hybrid'] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={`py-2.5 px-2 wobbly-border border-2 text-sm font-display font-bold transition-all cursor-pointer ${
                                                mode === m 
                                                    ? 'bg-slate-900 text-white border-slate-950 scale-[1.02]' 
                                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {m === 'topic' && 'Topic Only'}
                                            {m === 'playlist' && 'Playlist Only'}
                                            {m === 'hybrid' && 'Hybrid Mode'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic Input (Always show unless Mode 2: playlist-only is selected, which gets it from playlist metadata) */}
                            {mode !== 'playlist' && (
                                <div className="flex flex-col gap-2 animate-fade-in">
                                    <label className="font-display text-lg font-bold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-sketch-yellow fill-sketch-yellow" />
                                        What topic do you want to learn?
                                    </label>
                                    <input
                                        type="text"
                                        className="wobbly-border w-full p-3 font-sans text-lg bg-slate-50 border-2 border-dashed focus:outline-none"
                                        placeholder="e.g. Next.js App Router, Docker Fundamentals, PostgreSQL joins"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Playlist URL Input */}
                            {mode !== 'topic' && (
                                <div className="flex flex-col gap-2 animate-fade-in">
                                    <label className="font-display text-lg font-bold flex items-center gap-2">
                                        <Video className="w-5 h-5 text-red-500 fill-red-500/10" />
                                        YouTube Playlist URL
                                    </label>
                                    <input
                                        type="text"
                                        className="wobbly-border w-full p-3 font-sans text-lg bg-slate-50 border-2 border-dashed focus:outline-none"
                                        placeholder="e.g. https://youtube.com/playlist?list=XXXX"
                                        value={playlistUrl}
                                        onChange={(e) => setPlaylistUrl(e.target.value)}
                                    />
                                    <span className="text-xs text-slate-500 font-sans">
                                        Paste any public playlist URL. We'll extract the videos and map them into the course chapters.
                                    </span>
                                </div>
                            )}

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-display text-lg font-bold">Language</label>
                                    <Select value={language} onValueChange={(val) => {
                                        setLanguage(val);
                                        if (typeof document !== 'undefined') {
                                            document.cookie = `coursa_lang=${val}; path=/; max-age=31536000`;
                                        }
                                    }}>
                                        <SelectTrigger className="wobbly-border w-full p-3 h-auto font-sans text-lg bg-white focus:ring-sketch-primary">
                                            <SelectValue placeholder="Language" />
                                        </SelectTrigger>
                                        <SelectContent className="wobbly-border p-1 bg-white" position="popper">
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Hindi">Hindi</SelectItem>
                                            <SelectItem value="Hinglish">Hinglish</SelectItem>
                                            <SelectItem value="Spanish">Spanish</SelectItem>
                                            <SelectItem value="French">French</SelectItem>
                                            <SelectItem value="German">German</SelectItem>
                                            <SelectItem value="Japanese">Japanese</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="font-display text-lg font-bold">Syllabus Depth</label>
                                    <Select value={depth} onValueChange={setDepth}>
                                        <SelectTrigger className="wobbly-border w-full p-3 h-auto font-sans text-lg bg-white focus:ring-sketch-primary">
                                            <SelectValue placeholder="Depth" />
                                        </SelectTrigger>
                                        <SelectContent className="wobbly-border p-1 bg-white" position="popper">
                                            <SelectItem value="fullcourse">Full Course (5-10 Chapters)</SelectItem>
                                            <SelectItem value="quickcourse">Quick Course (3-5 Chapters)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateCourse}
                                disabled={generating || previewLoading || (mode !== 'topic' && !previewData)}
                                className="w-full mt-2 bg-sketch-primary text-white font-display text-2xl py-4 wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="animate-spin w-6 h-6" />
                                        <span>Generating Course...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Course From Playlist</span>
                                        <Sparkles className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Playlist Preview Card */}
                    <div className="md:col-span-5 w-full">
                        {previewLoading && (
                            <div className="w-full wobbly-border border-2 border-dashed bg-white p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <Loader2 className="animate-spin w-8 h-8 text-sketch-primary mb-3" />
                                <h4 className="font-display text-xl font-bold">Analyzing Playlist...</h4>
                                <p className="font-sans text-sm text-slate-500 mt-1">Downloading metadata, fetching durations, and structuring content.</p>
                            </div>
                        )}

                        {previewError && (
                            <div className="w-full wobbly-border border-2 border-red-200 bg-red-50 p-6 flex flex-col gap-3 min-h-[300px]">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="w-6 h-6 shrink-0" />
                                    <h4 className="font-display text-lg font-bold">Import Warning</h4>
                                </div>
                                <p className="font-sans text-base text-red-600 leading-normal">
                                    {previewError}
                                </p>
                                <div className="mt-2 text-xs text-slate-500 font-sans border-t border-red-200 pt-3 flex flex-col gap-1.5">
                                    <span className="font-bold text-slate-700">Common issues:</span>
                                    <span>• The playlist is marked Private or doesn't exist</span>
                                    <span>• The URL does not contain a list ID (e.g. `list=...`)</span>
                                    <span>• YouTube API rate limit is currently exhausted</span>
                                </div>
                            </div>
                        )}

                        {previewData && (
                            <div className="w-full wobbly-border border-2 border-sketch-primary bg-white p-6 flex flex-col gap-4 rotate-[0.5deg] hard-shadow min-h-[300px]">
                                <span className="font-display text-xs tracking-widest uppercase text-sketch-orange font-bold bg-orange-50 px-2 py-0.5 wobbly-border border self-start">
                                    Playlist Preview
                                </span>
                                
                                <div>
                                    <h3 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                                        {previewData.playlistTitle}
                                    </h3>
                                    <p className="font-sans text-sm text-slate-500 mt-1">
                                        Channel: <span className="font-bold text-slate-800">{previewData.channelName}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-t border-b border-dashed border-slate-200 py-3 my-1">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Book className="w-4 h-4 text-sketch-blue" />
                                        <div className="flex flex-col">
                                            <span className="font-sans text-xs text-slate-400">Videos</span>
                                            <span className="font-display text-base font-bold">{previewData.videoCount} Items</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Clock className="w-4 h-4 text-sketch-orange" />
                                        <div className="flex flex-col">
                                            <span className="font-sans text-xs text-slate-400">Duration</span>
                                            <span className="font-display text-base font-bold">{previewData.estimatedHours} Hours</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Videos List Scroll Area */}
                                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded">
                                    {previewData.videos.map((video: any, index: number) => (
                                        <div key={video.videoId} className="flex items-start gap-2.5 p-1.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0">
                                            <span className="font-display text-xs text-slate-400 font-bold w-4 shrink-0 mt-0.5">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-sans text-xs font-bold text-slate-800 leading-tight truncate">
                                                    {video.title}
                                                </h5>
                                                <span className="font-sans text-[10px] text-slate-400 block mt-0.5">
                                                    {Math.round(video.duration / 60)} min
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!previewLoading && !previewData && !previewError && (
                            <div className="w-full wobbly-border border-2 border-dashed bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <HelpCircle className="w-8 h-8 text-slate-400 mb-2" />
                                <h4 className="font-display text-lg font-bold text-slate-600">No Playlist Selected</h4>
                                <p className="font-sans text-sm text-slate-500 mt-1">Paste a YouTube Playlist URL in the form to preview playlist metadata, count, and duration.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
