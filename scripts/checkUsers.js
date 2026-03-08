require('dotenv').config();
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.DATABASE_URL);
  const res = await sql`SELECT column_name, data_type, is_identity, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users';`;
  console.log(res);
  await sql.end();
})();