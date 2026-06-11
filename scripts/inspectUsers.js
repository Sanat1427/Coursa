require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

(async () => {
  // We instantiate postgres directly to avoid importing the TS config file
  const sql = postgres(process.env.NEXT_PUBLIC_DATABASE_URL);
  try {
    const res = await sql`SELECT column_name, data_type, is_identity, identity_generation, udt_name
        FROM information_schema.columns
        WHERE table_name = 'users';`;

    console.log(res);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
    process.exit(0);
  }
})();
