import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playlistsTable, playlistVideosTable } from "@/lib/schema";
import { fetchPlaylistDetails } from "@/lib/youtube";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const playlistUrl = req.nextUrl.searchParams.get("playlistUrl");
        if (!playlistUrl) {
            return NextResponse.json({ error: "Missing playlistUrl" }, { status: 400 });
        }

        // Extract playlistId from URL
        let playlistId = playlistUrl.trim();
        try {
            if (playlistUrl.includes("list=")) {
                const urlObj = new URL(playlistUrl);
                const id = urlObj.searchParams.get("list");
                if (id) {
                    playlistId = id;
                }
            } else if (playlistUrl.includes("youtube.com/playlist") || playlistUrl.includes("youtu.be/")) {
                return NextResponse.json({ error: "Invalid YouTube Playlist URL. Make sure it contains 'list=...'" }, { status: 400 });
            }
        } catch (e) {
            // Handled as raw string
        }

        if (!playlistId || playlistId.length < 5) {
            return NextResponse.json({ error: "Invalid Playlist ID or URL" }, { status: 400 });
        }

        // 1. Check database cache
        const cachedPlaylists = await db.select().from(playlistsTable).where(eq(playlistsTable.playlistId, playlistId)).limit(1);
        
        if (cachedPlaylists.length > 0) {
            const playlist = cachedPlaylists[0];
            const videos = await db.select().from(playlistVideosTable)
                .where(eq(playlistVideosTable.playlistId, playlistId))
                .orderBy(playlistVideosTable.position);

            const totalDurationSeconds = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
            const estimatedHours = parseFloat((totalDurationSeconds / 3600).toFixed(1));

            return NextResponse.json({
                playlistId: playlist.playlistId,
                playlistTitle: playlist.playlistTitle,
                playlistDescription: playlist.playlistDescription,
                channelName: playlist.channelName,
                videoCount: playlist.videoCount,
                estimatedHours,
                videos,
                isCached: true
            });
        }

        // 2. Fetch from YouTube API
        console.log(`[YouTube] Fetching playlist metadata from API for: ${playlistId}`);
        const playlistData = await fetchPlaylistDetails(playlistId);

        if (!playlistData.videos || playlistData.videos.length === 0) {
            return NextResponse.json({ error: "This playlist is empty or private." }, { status: 400 });
        }

        // 3. Cache in DB
        await db.insert(playlistsTable).values({
            playlistId: playlistData.playlistId,
            playlistTitle: playlistData.playlistTitle,
            playlistDescription: playlistData.playlistDescription,
            channelName: playlistData.channelName,
            videoCount: playlistData.videoCount,
        });

        // Insert videos in batch
        const videosToInsert = playlistData.videos.map(v => ({
            playlistId: playlistData.playlistId,
            videoId: v.videoId,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            duration: v.duration,
            position: v.position,
        }));
        
        // Chunk inserts if there are too many videos
        for (let i = 0; i < videosToInsert.length; i += 50) {
            await db.insert(playlistVideosTable).values(videosToInsert.slice(i, i + 50));
        }

        const totalDurationSeconds = playlistData.videos.reduce((acc, v) => acc + v.duration, 0);
        const estimatedHours = parseFloat((totalDurationSeconds / 3600).toFixed(1));

        return NextResponse.json({
            playlistId: playlistData.playlistId,
            playlistTitle: playlistData.playlistTitle,
            playlistDescription: playlistData.playlistDescription,
            channelName: playlistData.channelName,
            videoCount: playlistData.videoCount,
            estimatedHours,
            videos: playlistData.videos,
            isCached: false
        });

    } catch (error: any) {
        console.error("GET /api/playlist/preview error:", error);
        let errorMsg = "Failed to load playlist. Please ensure the URL is correct and the playlist is public.";
        if (error.message && error.message.includes("quota")) {
            errorMsg = "YouTube API Rate Limit exceeded. Please try again later.";
        } else if (error.message) {
            errorMsg = error.message;
        }
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
