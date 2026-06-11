"use client";

import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";
import { useState } from "react";
import Image from "next/image";

interface SupabaseUploadZoneProps {
    bucket: string;
    folder?: string;
    accept?: string;
    onUploadComplete?: (url: string, path: string) => void;
}

export function SupabaseUploadZone({
    bucket,
    folder = "",
    accept = "image/*",
    onUploadComplete,
}: SupabaseUploadZoneProps) {
    const { upload, isLoading, error, progress } = useSupabaseUpload();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleUpload = async (file: File) => {
        try {
            const result = await upload(file, {
                bucket,
                folder,
                onSuccess: (url, path) => {
                    setImageUrl(url);
                    onUploadComplete?.(url, path);
                },
            });
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    return (
        <div className="w-full">
            {!imageUrl ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                        <p className="text-gray-700 font-medium">
                            {isLoading ? "Uploading..." : "Drag and drop your file here"}
                        </p>
                        <p className="text-sm text-gray-500">
                            or click to select a file
                        </p>
                        {isLoading && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt="Uploaded"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <button
                        onClick={() => setImageUrl(null)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                    >
                        Upload different image
                    </button>
                </div>
            )}
        </div>
    );
}
