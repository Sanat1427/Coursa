import 'dotenv/config';
import { db } from '../config/db';

(async () => {
  const res = await db.execute(
    "SELECT column_name, data_type, is_identity, udt_name FROM information_schema.columns WHERE table_name = 'users';"
  );
  console.log(res);
  process.exit(0);
})();
