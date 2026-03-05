require('dotenv').config();
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.DATABASE_URL);
  const res = await sql`SELECT table_name, column_name, data_type, is_identity, identity_generation
      FROM information_schema.columns
      WHERE is_identity='YES';`;
  console.log(res);
  await sql.end();
})();
