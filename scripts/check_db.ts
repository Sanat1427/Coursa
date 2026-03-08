import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from "../config/db";
import { chaptersTable } from "../config/schema";
import { desc } from "drizzle-orm";

async function main() {
    console.log("Fetching latest chapters...");
    const chapters = await db.select().from(chaptersTable).orderBy(desc(chaptersTable.createdAt)).limit(5);
    for (const ch of chapters) {
        console.log(`Chapter: ${ch.chapterTitle}`);
        console.log(`Materials:`, JSON.stringify(ch.contentMaterials, null, 2));
        console.log("-------------------");
    }
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
