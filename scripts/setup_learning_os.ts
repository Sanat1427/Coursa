import dotenv from 'dotenv';
import path from 'path';

// Load env files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log("Running DDL migrations for Learning OS...");
    
    // Dynamically import db to ensure env variables are loaded first
    const { db } = await import("../lib/db");
    const { sql } = await import("drizzle-orm");

    // 1. Alter concepts table to add new columns if they do not exist
    console.log("Adding metadata columns to 'concepts' table if not exists...");
    await db.execute(sql`
        ALTER TABLE concepts ADD COLUMN IF NOT EXISTS "whyItMatters" text;
        ALTER TABLE concepts ADD COLUMN IF NOT EXISTS "commonMistakes" text;
        ALTER TABLE concepts ADD COLUMN IF NOT EXISTS "realWorldApps" text;
    `);

    // 2. Create concept_mastery table if not exists
    console.log("Creating 'concept_mastery' table if not exists...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "concept_mastery" (
            "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            "userId" varchar(255) NOT NULL,
            "conceptId" varchar(255) NOT NULL REFERENCES concepts("id") ON DELETE CASCADE,
            "masteryScore" integer NOT NULL DEFAULT 0,
            "lastReviewedAt" timestamp NOT NULL DEFAULT now(),
            "createdAt" timestamp NOT NULL DEFAULT now(),
            "updatedAt" timestamp NOT NULL DEFAULT now()
        );
    `);

    // 3. Create indexes for concept_mastery
    console.log("Creating indexes for 'concept_mastery' if not exist...");
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "concept_mastery_user_concept_idx" ON "concept_mastery" ("userId", "conceptId");
        CREATE INDEX IF NOT EXISTS "concept_mastery_user_id_idx" ON "concept_mastery" ("userId");
    `);

    console.log("Database migrations completed successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
