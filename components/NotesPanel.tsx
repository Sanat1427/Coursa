"use client";
import React, { useState, useEffect } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Loader2, Plus, Tag, Trash2, Video, Bookmark as BookmarkIcon, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
    courseId: string;
    chapterId: string;
    ytPlayer: any; // YouTube player instance passed from parent
};

export default function NotesPanel({ courseId, chapterId, ytPlayer }: Props) {
    const [activeTab, setActiveTab] = useState<"notes" | "bookmarks">("notes");
    
    // Hooks
    const { note, saveNote, loading: loadingNotes } = useNotes(courseId, chapterId);
    const { bookmarks, addBookmark, deleteBookmark, loading: loadingBookmarks } = useBookmarks(courseId, chapterId);

    // Notes State
    const [localContent, setLocalContent] = useState("");
    const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [newTag, setNewTag] = useState("");

    // Bookmarks State
    const [bookmarkNote, setBookmarkNote] = useState("");
    const [bookmarkSaving, setBookmarkSaving] = useState(false);

    // Sync localContent when note loads or changes
    useEffect(() => {
        if (note) {
            setLocalContent(note.content);
        } else {
            setLocalContent("");
        }
        setSavingStatus("idle");
    }, [note]);

    // Autosave note content
    useEffect(() => {
        if (note === null && localContent === "") return;
        if (note && note.content === localContent) return;

        setSavingStatus("saving");
        const delayDebounceFn = setTimeout(async () => {
            try {
                await saveNote(localContent, note?.tags || []);
                setSavingStatus("saved");
            } catch (e) {
                console.error("Autosave failed", e);
                setSavingStatus("error");
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(delayDebounceFn);
    }, [localContent]);

    // Format helper for bookmarks
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Note actions
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        const tag = newTag.trim().toLowerCase();
        if (!tag) return;
        
        const currentTags = note?.tags || [];
        if (currentTags.includes(tag)) {
            toast.warning("Tag already exists");
            setNewTag("");
            return;
        }

        const updatedTags = [...currentTags, tag];
        setSavingStatus("saving");
        try {
            await saveNote(localContent, updatedTags);
            setSavingStatus("saved");
            setNewTag("");
        } catch (e) {
            setSavingStatus("error");
            toast.error("Failed to add tag");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const updatedTags = (note?.tags || []).filter(t => t !== tagToRemove);
        setSavingStatus("saving");
        try {
            await saveNote(localContent, updatedTags);
            setSavingStatus("saved");
        } catch (e) {
            setSavingStatus("error");
            toast.error("Failed to remove tag");
        }
    };

    // Bookmark actions
    const handleCaptureBookmark = async () => {
        if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") {
            toast.error("Video player is not initialized yet. Start the video to capture a bookmark!");
            return;
        }

        const currentTime = ytPlayer.getCurrentTime();
        setBookmarkSaving(true);
        try {
            await addBookmark(currentTime, bookmarkNote);
            setBookmarkNote("");
            toast.success(`Bookmarked at ${formatTime(currentTime)}!`);
        } catch (e) {
            toast.error("Failed to save bookmark");
        } finally {
            setBookmarkSaving(false);
        }
    };

    const handleSeek = (seconds: number) => {
        if (ytPlayer && typeof ytPlayer.seekTo === "function") {
            ytPlayer.seekTo(seconds, true);
            ytPlayer.playVideo();
            toast.success(`Seeking video to ${formatTime(seconds)}`);
        } else {
            toast.error("Video player is not initialized or ready");
        }
    };

    const handleDeleteBookmark = async (id: string) => {
        const toastId = toast.loading("Removing bookmark...");
        try {
            await deleteBookmark(id);
            toast.success("Bookmark removed", { id: toastId });
        } catch (e) {
            toast.error("Failed to delete bookmark", { id: toastId });
        }
    };

    return (
        <div className="w-full mt-6 bg-[#fdfaf6] wobbly-border hard-shadow flex flex-col min-h-[350px] relative overflow-hidden">
            {/* Top paper thumbtack accent */}
            <div className="thumbtack absolute -top-3 left-6 z-20"></div>

            {/* Notebook Tab Headers */}
            <div className="flex border-b wobbly-border border-dashed border-slate-300 bg-slate-50/50">
                <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-3 font-display text-lg font-bold border-r border-dashed border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "notes"
                            ? "bg-white text-sketch-primary underline decoration-2 decoration-sketch-primary"
                            : "text-slate-500 hover:bg-slate-100/50"
                    }`}
                >
                    📝 Study Notes
                </button>
                <button
                    onClick={() => setActiveTab("bookmarks")}
                    className={`flex-1 py-3 font-display text-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === "bookmarks"
                            ? "bg-white text-sketch-orange underline decoration-2 decoration-sketch-orange"
                            : "text-slate-500 hover:bg-slate-100/50"
                    }`}
                >
                    📍 Video Bookmarks
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-5 flex flex-col">
                
                {/* Notes Tab Content */}
                {activeTab === "notes" && (
                    <div className="flex-grow flex flex-col gap-4">
                        {loadingNotes ? (
                            <div className="flex-grow flex items-center justify-center gap-2 text-slate-400 italic font-display text-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-sketch-primary" />
                                Loading notes notebook...
                            </div>
                        ) : (
                            <>
                                {/* Notes Editor */}
                                <div className="flex-grow relative wobbly-border bg-white p-4 min-h-[180px] flex flex-col lined-paper-bg">
                                    <textarea
                                        value={localContent}
                                        onChange={(e) => setLocalContent(e.target.value)}
                                        className="w-full flex-grow bg-transparent border-none outline-none focus:outline-none resize-none font-sans text-slate-800 text-lg leading-7"
                                        placeholder="Jot down important points, steps, and key findings here... (Your changes autosave automatically!)"
                                    />
                                    
                                    {/* Autosave Status Indicator */}
                                    <div className="flex justify-end items-center gap-1.5 text-xs text-slate-400 font-sans mt-2">
                                        {savingStatus === "saving" && (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sketch-primary" />
                                                <span>Saving to canvas...</span>
                                            </>
                                        )}
                                        {savingStatus === "saved" && (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-green-600" />
                                                <span className="text-green-700 font-medium">All changes saved ✅</span>
                                            </>
                                        )}
                                        {savingStatus === "error" && (
                                            <>
                                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                                <span className="text-red-700 font-medium">Error saving notes</span>
                                            </>
                                        )}
                                        {savingStatus === "idle" && (
                                            <span>Autosave active ⚡</span>
                                        )}
                                    </div>
                                </div>

                                {/* Tags Section */}
                                <div className="border-t border-dashed border-slate-200 pt-3">
                                    <h4 className="font-display font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-2">
                                        <Tag className="w-4 h-4 text-sketch-primary" /> Tags
                                    </h4>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(note?.tags || []).map((tag) => (
                                            <span 
                                                key={tag}
                                                className="px-2 py-0.5 text-xs font-semibold bg-purple-50 text-sketch-primary wobbly-border border-purple-200 flex items-center gap-1 shrink-0"
                                            >
                                                #{tag}
                                                <button 
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="hover:text-red-600 ml-1 text-slate-400 cursor-pointer font-bold font-sans"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        {(note?.tags || []).length === 0 && (
                                            <span className="text-xs text-slate-400 font-sans italic">No tags associated. Add one below!</span>
                                        )}
                                    </div>

                                    <form onSubmit={handleAddTag} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="new-tag (e.g. 'setup')"
                                            className="w-48 px-3 py-1 wobbly-border border-slate-200 text-sm font-sans focus:outline-none focus:border-sketch-primary bg-white"
                                        />
                                        <button 
                                            type="submit"
                                            className="p-1 wobbly-border bg-black text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Bookmarks Tab Content */}
                {activeTab === "bookmarks" && (
                    <div className="flex-grow flex flex-col gap-4">
                        {/* Bookmark Capturer */}
                        <div className="wobbly-border border-2 border-dashed border-sketch-orange/30 p-4 bg-orange-50/20 flex flex-col gap-3">
                            <h4 className="font-display font-bold text-lg text-slate-800 flex items-center gap-1.5">
                                <BookmarkIcon className="w-5 h-5 text-sketch-orange" /> Tag Video Bookmark
                            </h4>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={bookmarkNote}
                                    onChange={(e) => setBookmarkNote(e.target.value)}
                                    placeholder="Add a reference note (e.g. 'Excellent CLI steps')"
                                    className="flex-grow px-3 py-2 wobbly-border border-slate-200 text-base font-sans bg-white focus:outline-none focus:border-sketch-orange"
                                />
                                <button
                                    onClick={handleCaptureBookmark}
                                    disabled={bookmarkSaving}
                                    className="px-4 py-2 wobbly-border bg-sketch-orange text-white font-display text-base font-bold hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {bookmarkSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Video className="w-4 h-4" />
                                            <span>Capture</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Bookmarks List */}
                        <div className="flex-grow flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                            <h5 className="font-display font-bold text-slate-700 text-sm mb-1">Captured Bookmarks</h5>
                            
                            {loadingBookmarks ? (
                                <div className="text-center py-6 text-slate-400 italic font-display text-base">
                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-sketch-orange" />
                                    Loading bookmarks...
                                </div>
                            ) : bookmarks.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-slate-200 bg-white text-slate-400 font-sans italic text-sm">
                                    No bookmarks captured for this chapter. Play the video and capture key moments!
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {bookmarks.map((bookmark) => (
                                        <div 
                                            key={bookmark.bookmarkId}
                                            className="wobbly-border border border-slate-200 bg-white p-3 flex items-center justify-between gap-4 group"
                                        >
                                            <div className="flex items-center gap-3 flex-grow">
                                                <button
                                                    onClick={() => handleSeek(bookmark.timestamp)}
                                                    className="px-2.5 py-1 wobbly-border border-sketch-orange/30 bg-orange-50 text-sketch-orange hover:bg-sketch-orange hover:text-white font-display text-sm font-bold transition-all shrink-0 cursor-pointer"
                                                    title="Click to seek video"
                                                >
                                                    📍 {formatTime(bookmark.timestamp)}
                                                </button>
                                                <span className="font-sans text-sm text-slate-600 line-clamp-1">
                                                    {bookmark.note || <span className="italic text-slate-400">Timestamp Marker</span>}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBookmark(bookmark.bookmarkId)}
                                                className="text-slate-400 hover:text-red-600 transition-colors shrink-0 p-1 cursor-pointer"
                                                title="Remove bookmark"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Lined paper custom backgrounds style definition */}
            <style jsx>{`
                .lined-paper-bg {
                    background-image: linear-gradient(#f8fafc 1px, transparent 1px);
                    background-size: 100% 28px;
                }
            `}</style>
        </div>
    );
}
