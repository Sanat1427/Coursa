import { useState, useEffect } from "react";
import axios from "axios";
import { Note } from "@/types/CourseType";

export function useNotes(courseId: string, chapterId: string) {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !chapterId) return;
        fetchNote();
    }, [courseId, chapterId]);

    const fetchNote = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/notes?courseId=${courseId}&chapterId=${chapterId}`);
            if (res.data && res.data.length > 0) {
                setNote(res.data[0]);
            } else {
                setNote(null);
            }
        } catch (e) {
            console.error("Error fetching note:", e);
        } finally {
            setLoading(false);
        }
    };

    const saveNote = async (content: string, tags: string[]) => {
        try {
            const res = await axios.post("/api/notes", {
                courseId,
                chapterId,
                content,
                tags,
            });
            setNote(res.data);
            return res.data;
        } catch (e) {
            console.error("Error saving note:", e);
            throw e;
        }
    };

    const deleteNote = async () => {
        if (!note) return;
        try {
            await axios.delete(`/api/notes/${note.noteId}`);
            setNote(null);
        } catch (e) {
            console.error("Error deleting note:", e);
            throw e;
        }
    };

    return {
        note,
        loading,
        saveNote,
        deleteNote,
        refetch: fetchNote
    };
}
