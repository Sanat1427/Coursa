# Supabase Storage Setup Guide

## Overview
This project now uses Supabase Storage for cloud file uploads. Free tier allows 1GB of storage per project.

## Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional, for server-side operations only)
```

> **Warning:** `SUPABASE_SERVICE_ROLE_KEY` is a highly sensitive admin-level secret. It
> should only be used in server-side code (API routes, server actions, etc.), must
> never be exposed to browser/client bundles or prefixed with `NEXT_PUBLIC_`, and
> should **not** be committed to source control. Store it in your platform's secret
> manager rather than `.env.local` in production.

## Setup Instructions

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project or use existing one
- Get your project URL and API keys from Settings > API

### 2. Create Storage Buckets
- Navigate to Storage in Supabase dashboard
- Create buckets for your needs:
  - `course-images` - for course thumbnails and images
  - `course-videos` - for video content
  - `course-files` - for other file types

### 3. Set Bucket Policies (Optional)
For public buckets, set policy to `Public`:
```sql
-- This allows public read access to all files in the bucket
```

## Usage Examples

### In Components
```tsx
import { SupabaseUploadZone } from "@/components/SupabaseUploadZone";

export function CourseForm() {
    return (
        <SupabaseUploadZone
            bucket="course-images"
            folder="thumbnails"
            accept="image/*"
            onUploadComplete={(url, path) => {
                console.log("Uploaded to:", url);
            }}
        />
    );
}
```

### Using the Hook
```tsx
import { useSupabaseUpload } from "@/hooks/useSupabaseUpload";

export function MyComponent() {
    const { upload, isLoading, error } = useSupabaseUpload();

    const handleUpload = async (file: File) => {
        const result = await upload(file, {
            bucket: "course-images",
            folder: "thumbnails",
            onSuccess: (url) => console.log("Success:", url),
            onError: (err) => console.log("Error:", err),
        });
    };

    return (
        <input
            type="file"
            onChange={(e) => handleUpload(e.target.files?.[0]!)}
            disabled={isLoading}
        />
    );
}
```

### API Endpoint
Direct file upload via API:

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("bucket", "course-images");
formData.append("folder", "thumbnails");

const response = await fetch("/api/upload-file", {
    method: "POST",
    body: formData,
});

const data = await response.json();
console.log("File URL:", data.url);
```

## Available Functions

### `uploadFileToSupabase(file, bucket, folder?)`
Upload a file to Supabase Storage.
- Returns: `{ success: boolean, url?, path?, error? }`

### `deleteFileFromSupabase(bucket, filepath)`
Delete a file from Supabase Storage.

### `getSupabaseFileUrl(bucket, filepath)`
Get the public URL for a file.

## File Size Limits
- Free tier: 1GB total storage
- Individual file size: Limited by your bucket settings
- Recommended: 
  - Images: up to 5-10MB
  - Videos: up to 100-500MB

## Performance Tips
1. **Compress images** before upload
2. **Use appropriate folders** to organize files
3. **Enable caching** (cache control is set to 3600s by default)
4. **Use CDN** - Supabase provides automatic CDN for public URLs

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is missing"
- Make sure environment variables are in `.env.local`
- Restart development server after adding environment variables

### Upload fails silently
- Check browser console for errors
- Verify bucket exists in Supabase dashboard
- Ensure bucket has correct visibility settings

### Files not appearing
- Check bucket policies/permissions
- Verify file path is correct
- Check Supabase dashboard under Storage
