import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is missing");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing");
}

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// For server-side operations with service role (optional)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    : null;
