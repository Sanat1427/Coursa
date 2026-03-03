import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

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
        const form = await req.formData();
        const file = form.get("file") as Blob | null;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tmpPath = path.join(tmpdir(), `upload-${Date.now()}${path.extname(file.type) || ".mp3"}`);

        // write to temporary location
        await fs.writeFile(tmpPath, buffer);

        // run whisper CLI; adjust arguments as needed (model, language, etc.)
        // the CLI will write a .txt file beside the audio file when finished
        await execFileAsync("whisper", [tmpPath, "--model", "small", "--language", "en", "--output_format", "txt", "--verbose", "false"]);

        const transcriptPath = tmpPath.replace(path.extname(tmpPath), ".txt");
        const text = await fs.readFile(transcriptPath, "utf-8");

        // cleanup
        await Promise.all([
            fs.unlink(tmpPath).catch(() => {}),
            fs.unlink(transcriptPath).catch(() => {}),
        ]);

        return NextResponse.json({ text });
    } catch (err: any) {
        console.error("transcribe error", err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
