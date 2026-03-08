import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);
        // SSRF Protection: Validate protocol and ensure it's pointing to a recognizable external storage if possible
        if (parsedUrl.protocol !== 'https:') {
            return new NextResponse("Forbidden URL protocol", { status: 403 });
        }

        const response = await fetch(parsedUrl.toString(), {
            headers: {
                // Ensure proper fetching
                'Accept': 'audio/mpeg, audio/*; q=0.9, */*; q=0.8',
            }
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch audio: ${response.statusText}`, { status: response.status });
        }

        return new NextResponse(response.body, {
            status: 200,
            headers: {
                "Content-Type": response.headers.get("content-type") || "audio/mpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
                // Enable unrestricted CORS on this proxy route
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
        });
    } catch (error: any) {
        console.error("Audio proxy error:", error);
        return new NextResponse("Internal Server Error fetching audio", { status: 500 });
    }
}
