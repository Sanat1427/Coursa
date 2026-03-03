import { NextRequest, NextResponse } from "next/server";
import { uploadFileToSupabase } from "@/utils/supabase-storage";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const bucket = formData.get("bucket") as string;
        const folder = (formData.get("folder") as string) || "";

        // Validate inputs
        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!bucket) {
            return NextResponse.json(
                { error: "No bucket provided" },
                { status: 400 }
            );
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
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "An error occurred during upload",
            },
            { status: 500 }
        );
    }
}
