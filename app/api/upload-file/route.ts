import { NextRequest, NextResponse } from "next/server";
import { uploadFileToSupabase } from "@/utils/supabase-storage";
import { currentUser } from "@clerk/nextjs/server";

const ALLOWED_BUCKETS = [
    "course-images",
    "course-videos",
    "course-files",
];

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const maybeFile = formData.get("file");
        if (!(maybeFile instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const file = maybeFile as File;

        const bucket = formData.get("bucket") as string;
        const folder = (formData.get("folder") as string) || "";

        // Validate inputs
        if (!bucket) {
            return NextResponse.json({ error: "No bucket provided" }, { status: 400 });
        }
        if (!ALLOWED_BUCKETS.includes(bucket)) {
            return NextResponse.json({ error: "Bucket not allowed" }, { status: 403 });
        }

        // Upload file to Supabase
        const result = await uploadFileToSupabase(file, bucket, folder);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            path: result.path,
        });
    } catch (error) {
        console.error("upload-file error", error);
        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
