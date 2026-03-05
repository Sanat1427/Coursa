const { db } = require('../config/db');
const { sql } = require('drizzle-orm');

(async () => {
  const res = await db.query(sql`SELECT column_name, data_type, is_identity, identity_generation, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users';`);
  console.log(res);
  process.exit(0);
})();
