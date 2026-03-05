import { supabase, supabaseAdmin } from "@/config/storage";

function sanitizeComponent(str: string): string {
    const normalized = str.normalize("NFC");
    // allow letters, numbers, dot, dash, underscore
    let safe = normalized.replace(/[^A-Za-z0-9.\-_/]/g, "-");
    safe = safe.replace(/[\/]+/g, "-"); // no path separators
    safe = safe.replace(/[-_.]{2,}/g, "-");
    safe = safe.replace(/^[\-_.]+|[\-_.]+$/g, "");
    return safe;
}

export interface UploadResponse {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Bucket name (e.g., "course-images", "course-videos")
 * @param folder - Optional folder path within the bucket
 * @returns Upload response with file URL and path
 */
export async function uploadFileToSupabase(
    file: File,
    bucket: string,
    folder: string = ""
): Promise<UploadResponse> {
    try {
        // sanitize components
        const timestamp = Date.now();
        const safeName = sanitizeComponent(file.name);
        const filename = `${timestamp}-${safeName}`;
        const safeFolder = folder ? sanitizeComponent(folder) : "";
        const filepath = safeFolder ? `${safeFolder}/${filename}` : filename;

        // choose admin client for server-side uploads if available
        const client = supabaseAdmin ?? supabase;

        const { data, error } = await client.storage
            .from(bucket)
            .upload(filepath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // Get the public URL
        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filepath);

        return {
            success: true,
            url: publicData.publicUrl,
            path: filepath,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Bucket name
 * @param filepath - File path in the bucket
 */
export async function deleteFileFromSupabase(
    bucket: string,
    filepath: string
): Promise<UploadResponse> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filepath]);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Get a file URL from Supabase Storage
 * @param bucket - Bucket name
 * @param filepath - File path in the bucket
 */
export function getSupabaseFileUrl(bucket: string, filepath: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filepath);
    return data.publicUrl;
}
