import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run tests');
}
const sql = postgres(process.env.DATABASE_URL);
async function test() {
    try {
        const d = await sql`SELECT 1 as val`;
        console.log('Success:', d);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

(async () => {
    await test();
})();
