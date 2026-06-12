"use server"

import { db } from "@/lib/db";
import { courseTable, chaptersTable, playlistsTable, playlistVideosTable } from "@/lib/schema";
import { client } from "@/lib/gemini";
import { Course_config_prompt, Playlist_course_config_prompt, Hybrid_course_config_prompt } from "@/data/Prompt";
import { currentUser } from "@clerk/nextjs/server";
import { and, ilike, eq } from "drizzle-orm";

export async function createCourseAction({
    userInput,
    type,
    language,
    courseId,
    playlistId,
    mode = 'topic'
}: {
    userInput: string;
    type: string;
    language: string;
    courseId: string;
    playlistId?: string;
    mode?: 'topic' | 'playlist' | 'hybrid';
}) {
    const user = await currentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const safeUserEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

    // Check Cache
    let existingCourse = null;
    if (mode === 'topic') {
        const results = await db.select().from(courseTable)
            .where(
                and(
                    ilike(courseTable.userInput, userInput),
                    eq(courseTable.type, type),
                    eq(courseTable.userId, safeUserEmail)
                )
            )
            .limit(1);
        if (results.length > 0) {
            existingCourse = results[0];
        }
    } else {
        const userCourses = await db.select().from(courseTable)
            .where(eq(courseTable.userId, safeUserEmail));
        
        for (const c of userCourses) {
            const layout = c.courseLayout as any;
            if (layout && layout.playlistId === playlistId && layout.mode === mode) {
                if (mode === 'playlist' || ilike(c.userInput, userInput)) {
                    existingCourse = c;
                    break;
                }
            }
        }
    }

    if (existingCourse) {
        const existingChapters = await db.select().from(chaptersTable)
            .where(eq(chaptersTable.courseId, existingCourse.courseId));
        
        const totalExpected = (existingCourse.courseLayout as any)?.chapters?.length || 0;

        if (existingChapters.length >= totalExpected && existingChapters.every(ch => ch.youtubeVideoId && ch.contentMaterials)) {
            return { courseId: existingCourse.courseId, isCached: true };
        }
    }

    // Build Prompt & Call Gemini
    let systemPrompt = Course_config_prompt;
    let userMessage = 'Course Topic is: ' + userInput + ', Course Type: ' + type + ', Language: ' + (language || 'English');

    if (mode === 'playlist' || mode === 'hybrid') {
        if (!playlistId) {
            throw new Error("playlistId is required for playlist or hybrid mode");
        }

        // Fetch playlist and its videos
        let playlistMeta = await db.select().from(playlistsTable).where(eq(playlistsTable.playlistId, playlistId)).limit(1);
        if (playlistMeta.length === 0) {
            console.log(`[YouTube] Playlist metadata not cached, fetching: ${playlistId}`);
            const fetched = await fetchPlaylistDetails(playlistId);
            await db.insert(playlistsTable).values({
                playlistId: fetched.playlistId,
                playlistTitle: fetched.playlistTitle,
                playlistDescription: fetched.playlistDescription,
                channelName: fetched.channelName,
                videoCount: fetched.videoCount,
            });
            const videosToInsert = fetched.videos.map(v => ({
                playlistId: fetched.playlistId,
                videoId: v.videoId,
                title: v.title,
                description: v.description,
                thumbnail: v.thumbnail,
                duration: v.duration,
                position: v.position,
            }));
            for (let i = 0; i < videosToInsert.length; i += 50) {
                await db.insert(playlistVideosTable).values(videosToInsert.slice(i, i + 50));
            }
            playlistMeta = await db.select().from(playlistsTable).where(eq(playlistsTable.playlistId, playlistId)).limit(1);
        }

        const videos = await db.select().from(playlistVideosTable)
            .where(eq(playlistVideosTable.playlistId, playlistId))
            .orderBy(playlistVideosTable.position);

        const videosListText = videos.map((v, idx) => `${idx + 1}. Title: "${v.title}", VideoID: "${v.videoId}", Duration: ${v.duration}s, Description: "${(v.description || '').slice(0, 150)}..."`).join('\n');

        if (mode === 'playlist') {
            systemPrompt = Playlist_course_config_prompt
                .replace('{playlistTitle}', playlistMeta[0].playlistTitle)
                .replace('{playlistDescription}', playlistMeta[0].playlistDescription || '')
                .replace('{channelName}', playlistMeta[0].channelName || '')
                .replace('{videosList}', videosListText);
            userMessage = `Generate the course using the provided YouTube playlist videos. Language: ${language || 'English'}`;
        } else {
            systemPrompt = Hybrid_course_config_prompt
                .replace('{topic}', userInput)
                .replace('{playlistTitle}', playlistMeta[0].playlistTitle)
                .replace('{playlistDescription}', playlistMeta[0].playlistDescription || '')
                .replace('{channelName}', playlistMeta[0].channelName || '')
                .replace('{videosList}', videosListText);
            userMessage = `Generate the course for Topic: "${userInput}". Try to use the playlist videos where appropriate. Language: ${language || 'English'}`;
        }
    }

    const resp = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            topic: userInput,
            contentType: "course"
        }
    });

    const rawResult = resp.text || '';
    const sanitizedResult = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const JsonResult = JSON.parse(sanitizedResult);

    // Embed metadata in layout
    JsonResult.playlistId = playlistId || null;
    JsonResult.mode = mode;

    await db.insert(courseTable).values({
        userId: safeUserEmail,
        courseId: courseId,
        courseName: JsonResult?.courseName || 'Generated Course',
        userInput: userInput || JsonResult?.courseName || 'Imported Playlist',
        type: type,
        language: language || 'English',
        courseLayout: JsonResult,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // If Mode 2 or 3, pre-populate mapped chapters in the chapters table
    if (mode === 'playlist' || mode === 'hybrid') {
        const layoutChapters = JsonResult?.chapters || [];
        for (const ch of layoutChapters) {
            if (ch.youtubeVideoId) {
                const chapterId = `${courseId}-${ch.chapterId}`;
                await db.insert(chaptersTable).values({
                    courseId,
                    chapterId,
                    chapterTitle: ch.chapterTitle,
                    youtubeVideoId: ch.youtubeVideoId,
                    contentMaterials: { articles: [] },
                    videoContent: {
                        subContent: ch.subContent || [],
                        videoLanguage: language || 'English',
                        isFallback: false,
                        fallbackMessage: "",
                        alternativeVideos: []
                    }
                });
            }
        }
    }

    return { courseId, isCached: false };
}
