require('dotenv').config();
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('Alteration SQL start');
    await sql`ALTER TABLE users ALTER COLUMN id DROP IDENTITY IF EXISTS`;
    await sql`ALTER TABLE users ALTER COLUMN id TYPE varchar(255)`;
    console.log('Alteration complete');
  } catch (e) {
    console.error('Error altering column', e);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
