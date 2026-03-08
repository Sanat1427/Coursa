import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function check() {
    const res = await sql`SELECT "courseId", "userId", "courseName" FROM "courses" ORDER BY "createdAt" DESC LIMIT 5`;
    console.log(res);
}
check();
