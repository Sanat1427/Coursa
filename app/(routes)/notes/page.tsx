"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, Search, Tag, Trash2, Edit3, BookOpen, AlertCircle, Loader2, Save, X, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function MyNotesPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromCourseId = searchParams.get("fromCourseId");
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Edit modal states
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTagsInput, setEditTagsInput] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        } else if (user) {
            fetchNotes();
        }
    }, [user, isLoaded]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/notes");
            setNotes(res.data || []);
        } catch (e) {
            console.error("Failed to fetch notes:", e);
            toast.error("Could not load study notes");
        } finally {
            setLoading(false);
        }
    };

    // Filter notes based on keyword and selected tag
    const filteredNotes = notes.filter((note) => {
        const matchesKeyword = searchQuery.trim() === "" || 
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.courseName.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
        
        return matchesKeyword && matchesTag;
    });

    // Group notes by courseName
    const groupedNotes: Record<string, { courseId: string; chapters: any[] }> = {};
    filteredNotes.forEach((note) => {
        if (!groupedNotes[note.courseName]) {
            groupedNotes[note.courseName] = {
                courseId: note.courseId,
                chapters: [],
            };
        }
        groupedNotes[note.courseName].chapters.push(note);
    });

    // Unique list of all tags present in user's notes
    const allTags = Array.from(
        new Set(notes.flatMap((n) => n.tags || []))
    ).sort();

    // Delete a note
    const handleDeleteNote = async (noteId: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this study note?");
        if (!confirmDelete) return;

        const toastId = toast.loading("Deleting note...");
        try {
            await axios.delete(`/api/notes/${noteId}`);
            toast.success("Note removed successfully!", { id: toastId });
            setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
        } catch (e) {
            toast.error("Failed to delete note.", { id: toastId });
        }
    };

    // Edit Modal helpers
    const openEditModal = (note: any) => {
        setEditingNote(note);
        setEditContent(note.content);
        setEditTags(note.tags || []);
        setEditTagsInput("");
    };

    const handleAddEditTag = (e: React.FormEvent) => {
        e.preventDefault();
        const tag = editTagsInput.trim().toLowerCase();
        if (!tag) return;
        if (editTags.includes(tag)) {
            toast.warning("Tag already exists");
            setEditTagsInput("");
            return;
        }
        setEditTags((prev) => [...prev, tag]);
        setEditTagsInput("");
    };

    const handleRemoveEditTag = (tagToRemove: string) => {
        setEditTags((prev) => prev.filter((t) => t !== tagToRemove));
    };

    const handleSaveEdit = async () => {
        if (!editingNote) return;
        setSaving(true);
        const toastId = toast.loading("Saving changes...");
        try {
            const res = await axios.put(`/api/notes/${editingNote.noteId}`, {
                content: editContent,
                tags: editTags,
            });
            toast.success("Note updated successfully!", { id: toastId });
            setNotes((prev) =>
                prev.map((n) => (n.noteId === editingNote.noteId ? { ...n, content: editContent, tags: editTags } : n))
            );
            setEditingNote(null);
        } catch (e) {
            toast.error("Failed to save note.", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-center dot-pattern min-h-screen py-10 px-4 md:px-10">
            {/* Header Navigation */}
            <div className="w-full max-w-5xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={fromCourseId ? `/profile?fromCourseId=${fromCourseId}` : "/profile"}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-yellow/20 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                            Back to Profile
                        </button>
                    </Link>
                    {fromCourseId && (
                        <Link href={`/course/${fromCourseId}`}>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                                <ChevronLeft className="w-5 h-5" />
                                Back to Course
                            </button>
                        </Link>
                    )}
                </div>
                <Link href="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white wobbly-border hard-shadow-sm font-display text-lg hover:bg-sketch-primary/10 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                        Canvas Homepage
                    </button>
                </Link>
            </div>

            {/* Dashboard Header */}
            <div className="w-full max-w-5xl text-center md:text-left mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="font-display text-5xl font-bold text-slate-900">My Study Notes 📓</h1>
                    <p className="font-sans text-xl text-slate-500 mt-2">Manage, filter, and search your annotated sketchbook notes.</p>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full max-w-5xl">
                {/* Search & Tags Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Search Panel */}
                    <div className="wobbly-border bg-white p-5 hard-shadow relative">
                        <div className="thumbtack absolute -top-3 left-4 z-20"></div>
                        <h3 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 text-sketch-primary" /> Search
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search note details..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 wobbly-border border-slate-200 text-sm font-sans focus:outline-none focus:border-sketch-primary bg-slate-50/50"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Tags Panel */}
                    <div className="wobbly-border bg-white p-5 hard-shadow relative">
                        <div className="thumbtack absolute -top-3 left-4 z-20"></div>
                        <h3 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-sketch-primary" /> Filter Tags
                        </h3>
                        
                        <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-1">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`text-left px-3 py-1.5 text-sm font-sans w-full rounded transition-colors ${
                                    selectedTag === null
                                        ? "bg-purple-100 text-sketch-primary font-bold"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                All Notes ({notes.length})
                            </button>
                            {allTags.map((tag) => {
                                const count = notes.filter((n) => n.tags && n.tags.includes(tag)).length;
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag)}
                                        className={`text-left px-3 py-1.5 text-sm font-sans w-full rounded transition-colors flex items-center justify-between ${
                                            selectedTag === tag
                                                ? "bg-purple-100 text-sketch-primary font-bold"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>#{tag}</span>
                                        <span className="text-xs text-slate-400 font-sans">({count})</span>
                                    </button>
                                );
                            })}
                            {allTags.length === 0 && (
                                <div className="text-slate-400 italic text-xs p-3 font-sans text-center">No tags in notes.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes List Column */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {loading ? (
                        <div className="p-16 wobbly-border border-dashed text-center bg-white hard-shadow flex items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-sketch-primary" />
                            <span className="font-display text-xl text-slate-500 italic">Reading your notebooks...</span>
                        </div>
                    ) : Object.keys(groupedNotes).length === 0 ? (
                        <div className="w-full p-16 wobbly-border border-dashed text-center bg-white hard-shadow flex flex-col items-center">
                            <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="font-display text-2xl text-slate-400 italic">No matching notes found.</p>
                            {notes.length === 0 && (
                                <Link href="/" className="mt-4">
                                    <button className="bg-sketch-primary text-white font-display text-xl px-6 py-2.5 wobbly-border hard-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                                        Explore Courses & Write Notes 🚀
                                    </button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        Object.entries(groupedNotes).map(([courseName, group], idx) => (
                            <div 
                                key={courseName} 
                                className={`wobbly-border bg-white p-6 md:p-8 hard-shadow flex flex-col gap-6 relative ${
                                    idx % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.5deg]"
                                }`}
                            >
                                <div className="thumbtack absolute -top-3 left-8 z-20"></div>
                                
                                {/* Course Group Header */}
                                <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-3">
                                    <h2 className="font-display text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        🎨 {courseName}
                                    </h2>
                                    <Link href={`/course/${group.courseId}`}>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 wobbly-border text-xs bg-black text-white hover:bg-slate-800 transition-all font-display cursor-pointer">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>Open Course</span>
                                        </button>
                                    </Link>
                                </div>

                                {/* Chapters in Course */}
                                <div className="flex flex-col gap-6">
                                    {group.chapters.map((chapterNote) => (
                                        <div 
                                            key={chapterNote.noteId} 
                                            className="p-5 wobbly-border border-dashed border border-slate-200 bg-slate-50/35 flex flex-col gap-3"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <h3 className="font-display text-xl font-bold text-slate-800">
                                                    📖 Chapter: {chapterNote.chapterTitle}
                                                </h3>
                                                <span className="text-xs text-slate-400 font-sans shrink-0">
                                                    {moment(chapterNote.updatedAt).fromNow()}
                                                </span>
                                            </div>

                                            {/* Note Content Snippet */}
                                            <p className="font-sans text-slate-600 whitespace-pre-wrap leading-relaxed text-base">
                                                {chapterNote.content}
                                            </p>

                                            {/* Tags and Controls */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-dashed border-slate-200 pt-3 mt-1">
                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {chapterNote.tags.map((tag: string) => (
                                                        <span 
                                                            key={tag} 
                                                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                                            className={`px-2 py-0.5 text-xs font-semibold wobbly-border border-purple-100 cursor-pointer shrink-0 ${
                                                                selectedTag === tag 
                                                                    ? "bg-sketch-primary text-white" 
                                                                    : "bg-purple-50 text-sketch-primary hover:bg-purple-100"
                                                            }`}
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {chapterNote.tags.length === 0 && (
                                                        <span className="text-xs text-slate-400 font-sans italic">No tags</span>
                                                    )}
                                                </div>

                                                {/* Controls */}
                                                <div className="flex items-center gap-3 justify-end">
                                                    <button
                                                        onClick={() => openEditModal(chapterNote)}
                                                        className="flex items-center gap-1 px-3 py-1.5 wobbly-border border-slate-300 text-xs bg-white text-slate-700 hover:bg-slate-50 transition-colors font-display cursor-pointer"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        <span>Edit Note</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNote(chapterNote.noteId)}
                                                        className="flex items-center gap-1 px-3 py-1.5 wobbly-border border-red-200 text-xs bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-display cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Note Edit Modal Overlay */}
            {editingNote && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-2xl bg-[#fdfaf6] wobbly-border hard-shadow p-6 relative flex flex-col gap-4">
                        <div className="thumbtack absolute -top-3 left-10 z-20"></div>
                        
                        <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-3">
                            <h3 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-sketch-primary fill-sketch-primary" />
                                Edit Note: {editingNote.chapterTitle}
                            </h3>
                            <button 
                                onClick={() => setEditingNote(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Note Editor Area */}
                        <div className="w-full relative wobbly-border bg-white p-4 min-h-[200px] flex flex-col lined-paper-bg">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full flex-grow bg-transparent border-none outline-none focus:outline-none resize-none font-sans text-slate-800 text-lg leading-7"
                                placeholder="Write note details..."
                            />
                        </div>

                        {/* Tags Editor */}
                        <div>
                            <label className="font-display font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-2">
                                <Tag className="w-4 h-4 text-sketch-primary" /> Edit Tags
                            </label>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                {editTags.map((tag) => (
                                    <span 
                                        key={tag}
                                        className="px-2 py-0.5 text-xs font-semibold bg-purple-50 text-sketch-primary wobbly-border border-purple-200 flex items-center gap-1 shrink-0"
                                    >
                                        #{tag}
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveEditTag(tag)}
                                            className="hover:text-red-600 ml-1 text-slate-400 cursor-pointer font-bold font-sans"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {editTags.length === 0 && (
                                    <span className="text-xs text-slate-400 font-sans italic">No tags</span>
                                )}
                            </div>

                            <form onSubmit={handleAddEditTag} className="flex gap-2">
                                <input
                                    type="text"
                                    value={editTagsInput}
                                    onChange={(e) => setEditTagsInput(e.target.value)}
                                    placeholder="add-tag"
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

                        {/* Actions */}
                        <div className="flex justify-end gap-3 border-t border-dashed border-slate-200 pt-4 mt-2">
                            <button
                                onClick={() => setEditingNote(null)}
                                className="px-5 py-2 wobbly-border bg-white text-slate-700 hover:bg-slate-50 font-display text-lg cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-6 py-2 bg-sketch-primary text-white font-display text-lg font-bold wobbly-border hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notebook background pattern styles definition */}
            <style jsx>{`
                .lined-paper-bg {
                    background-image: linear-gradient(#f8fafc 1px, transparent 1px);
                    background-size: 100% 28px;
                }
            `}</style>
        </div>
    );
}
