import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
}

const globalForDb = globalThis as unknown as {
    __postgresClient: postgres.Sql | undefined;
    __drizzleDB: ReturnType<typeof drizzle> | undefined;
};

const queryClient = globalForDb.__postgresClient ?? postgres(process.env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.__postgresClient = queryClient;

export const db = globalForDb.__drizzleDB ?? drizzle(queryClient);
if (process.env.NODE_ENV !== "production") globalForDb.__drizzleDB = db;
