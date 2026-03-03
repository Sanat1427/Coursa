import { client } from "@/config/gemini";
import { VideoSlides } from "@/data/Dummy";
import { Generate_Video_Prompt } from "@/data/Prompt";
import { Language } from "@google/genai";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/config/storage";
import { db } from "@/config/db";
import { chaptersTable, chapterContentSlidesTable } from "@/config/schema";

export async function POST(req: NextRequest) {
    const { chapter, courseId } = await req.json();
    //generate json schema for video
    //  const resp = await client.models.generateContent({
    // model: 'gemini-2.5-flash',
    // contents: 'Course Detail is: ' + JSON.stringify(chapter),
    // config: {
    //  systemInstruction: Generate_Video_Prompt,
    // responseMimeType: "application/json",
    //  }
    //  });
    // const airesult = resp.text;
    // const VideoContent = JSON.parse(airesult?.replace('```json', '').replace('```', ''  ) || '[]');
    // return NextResponse.json({ VideoContent });
    const VideoContent = VideoSlides;
    // some responses wrap slides inside a `VideoContent` property; normalize to plain array
    const slidesArray: any[] = Array.isArray(VideoContent) && VideoContent[0]?.VideoContent
        ? VideoContent[0].VideoContent
        : (VideoContent as any[]);

    let audiofileurls: string[] = [];

    for (let i = 0; i < slidesArray.length; i++) {
        const slide = slidesArray[i];
        // generate audio for this slide
        const fondaResult = await axios.post('https://api.fonada.ai/tts/generate-audio-large', {
            input: 'narration',
            voice: "Vaanee",
            language: 'English',

        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.FONADALAB_API_KEY}`

            },
            responseType: 'arraybuffer',
            timeout: 120000
        });

        const audioBuffer = Buffer.from(fondaResult.data);
        const audioFile = `audio-${courseId}-chapter-${i}-${Date.now()}.mp3`;
        const audioUrl = await SaveAudioToStorage(audioBuffer, audioFile);
        console.log('Audio stored at:', audioUrl);
        audiofileurls.push(audioUrl || '');
    }

    // persist to database
    const chapterId = chapter.chapterId || `chap-${Date.now()}`;
    await db.insert(chaptersTable).values({
        courseId,
        chapterId,
        chapterTitle: chapter.chapterTitle || '',
        videoContent: VideoContent,
        caption: chapter.caption || null,
        audioFileUrl: audiofileurls[0] || null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // insert each slide record
    for (let i = 0; i < slidesArray.length; i++) {
        const slide = slidesArray[i];
        await db.insert(chapterContentSlidesTable).values({
            courseId,
            chapterId,
            slideId: slide.slideId,
            slideIndex: slide.slideIndex,
            audioFileName: slide.audioFileName,
            audioFileUrl: audiofileurls[i] || null,
            narration: slide.narration,
            html: slide.html,
            revealData: slide.revealData,
        });
    }

    return NextResponse.json({ VideoContent, audiofileurls });
}
const SaveAudioToStorage = async (audioBuffer: Buffer, fileName: string) => {
    try {
        // Choose client: prefer service-role (admin) for server operations to avoid RLS policies
        const bucketName = 'course-videos';
        const bucket = supabaseAdmin
            ? supabaseAdmin.storage.from(bucketName)
            : supabase.storage.from(bucketName);

        // Create blob name with folder structure
        const blobName = `audio/${fileName}`;

        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(audioBuffer);

        // Upload audio data to Supabase Storage
        let uploadResponse = await bucket.upload(blobName, uint8Array, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: false,
        });

        // if bucket not found try to create it (requires service role key)
        if (uploadResponse.error && uploadResponse.error.message.includes('Bucket not found')) {
            console.warn(`Bucket "${bucketName}" not found, attempting to create...`);
            if (supabaseAdmin) {
                const createRes = await supabaseAdmin.storage.createBucket(bucketName, {
                    public: true,
                });
                if (createRes.error) {
                    console.error('Failed to create bucket:', createRes.error.message);
                    return null;
                }
                // retry upload
                uploadResponse = await bucket.upload(blobName, uint8Array, {
                    contentType: 'audio/mpeg',
                    cacheControl: '3600',
                    upsert: false,
                });
            } else {
                console.error('Bucket does not exist and no admin client available');
            }
        }

        // Handle upload errors after possible retry
        if (uploadResponse.error) {
            console.error('Failed to upload audio:', uploadResponse.error.message);
            return null;
        }

        // Return public URL
        const publicBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const url = publicBaseUrl
            ? `${publicBaseUrl}/storage/v1/object/public/${bucketName}/${blobName}`
            : null;

        console.log('Audio uploaded successfully:', url);
        return url;
    } catch (error) {
        console.error('Error uploading audio to Supabase:', error);
        return null;
    }
};