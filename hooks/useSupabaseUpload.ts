import { useState } from "react";

interface UploadOptions {
    bucket: string;
    folder?: string;
    onSuccess?: (url: string, path: string) => void;
    onError?: (error: string) => void;
}

export function useSupabaseUpload() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const upload = async (file: File, options: UploadOptions) => {
        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucket", options.bucket);
            if (options.folder) {
                formData.append("folder", options.folder);
            }

            const response = await fetch("/api/upload-file", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await response.json();
            setProgress(100);

            if (options.onSuccess) {
                options.onSuccess(data.url, data.path);
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Upload failed";
            setError(errorMessage);

            if (options.onError) {
                options.onError(errorMessage);
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        upload,
        isLoading,
        error,
        progress,
    };
}
