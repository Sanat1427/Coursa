import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import { currentUser } from "@clerk/nextjs/server";

const execFileAsync = promisify(execFile);

const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIMES = ["audio/mpeg", "audio/wav", "audio/webm"];

function mimeToExt(mime: string): string {
    switch (mime) {
        case "audio/mpeg":
            return ".mp3";
        case "audio/wav":
            return ".wav";
        case "audio/webm":
            return ".webm";
        default:
            return "";
    }
}

/**
 * POST /api/transcribe
 * Accepts a multipart/form-data request with a file field named "file".
 * Runs OpenAI Whisper locally (via the "whisper" CLI) to transcribe audio.
 * Requires Python and the whisper package installed in the environment:
 *
 *    pip install -U openai-whisper
 *
 * or use the whisper.cpp npm wrapper if you prefer.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const form = await req.formData();
        const maybeFile = form.get("file");
        if (!(maybeFile instanceof File)) {
            return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
        }
        const file = maybeFile as File;

        if (file.size > MAX_AUDIO_BYTES) {
            return NextResponse.json({ error: "File too large" }, { status: 413 });
        }
        if (!ALLOWED_MIMES.includes(file.type)) {
            return NextResponse.json({ error: "Unsupported media type" }, { status: 415 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // determine extension from name or mime
        const ext = path.extname(file.name) || mimeToExt(file.type) || ".mp3";
        const tmpPath = path.join(tmpdir(), `upload-${Date.now()}${ext}`);

        // write to temporary location
        await fs.writeFile(tmpPath, buffer);

        const transcriptPath = tmpPath.replace(path.extname(tmpPath), ".txt");

        // run whisper CLI; adjust arguments as needed (model, language, etc.)
        // the CLI will write a .txt file beside the audio file when finished
        const WHISPER_TIMEOUT = process.env.WHISPER_TIMEOUT_MS ? parseInt(process.env.WHISPER_TIMEOUT_MS, 10) : 30000;

        try {
            await execFileAsync("whisper", [tmpPath, "--model", "small", "--language", "en", "--output_format", "txt", "--verbose", "false"], { timeout: WHISPER_TIMEOUT });
        } catch (execErr: any) {
            // Clean up temporary audio file on failure
            await fs.unlink(tmpPath).catch(() => { });

            if (execErr.killed) {
                return NextResponse.json({ error: "Transcription process timed out." }, { status: 504 });
            }
            throw execErr;
        }

        const text = await fs.readFile(transcriptPath, "utf-8");

        // cleanup
        await Promise.all([
            fs.unlink(tmpPath).catch(() => { }),
            fs.unlink(transcriptPath).catch(() => { }),
        ]);

        return NextResponse.json({ text });
    } catch (err: any) {
        console.error("transcribe error", err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
