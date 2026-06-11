import { useState, useEffect } from "react";
import axios from "axios";
import { Bookmark } from "@/types/CourseType";

export function useBookmarks(courseId: string, chapterId: string) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chapterId) return;
        fetchBookmarks();
    }, [chapterId]);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/bookmarks?chapterId=${chapterId}`);
            setBookmarks(res.data || []);
        } catch (e) {
            console.error("Error fetching bookmarks:", e);
        } finally {
            setLoading(false);
        }
    };

    const addBookmark = async (timestamp: number, note?: string) => {
        try {
            const res = await axios.post("/api/bookmarks", {
                courseId,
                chapterId,
                timestamp,
                note,
            });
            setBookmarks(prev => {
                const updated = [...prev, res.data];
                return updated.sort((a, b) => a.timestamp - b.timestamp);
            });
            return res.data;
        } catch (e) {
            console.error("Error adding bookmark:", e);
            throw e;
        }
    };

    const deleteBookmark = async (bookmarkId: string) => {
        try {
            await axios.delete(`/api/bookmarks/${bookmarkId}`);
            setBookmarks(prev => prev.filter(b => b.bookmarkId !== bookmarkId));
        } catch (e) {
            console.error("Error deleting bookmark:", e);
            throw e;
        }
    };

    return {
        bookmarks,
        loading,
        addBookmark,
        deleteBookmark,
        refetch: fetchBookmarks
    };
}
