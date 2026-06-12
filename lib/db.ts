import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

declare global {
    var postgresClient: ReturnType<typeof postgres> | undefined;
    var drizzleDB: ReturnType<typeof drizzle> | undefined;
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
}

const poolSize = 5;

// Log connection creation
if (!global.postgresClient) {
    console.log(`[DB] Initializing new Postgres connection pool (max pool size: ${poolSize})`);
} else {
    console.log(`[DB] Reusing existing global Postgres connection pool`);
}

const client = global.postgresClient ?? postgres(process.env.DATABASE_URL, { 
    prepare: false, 
    max: poolSize,
    idle_timeout: 20,
    connect_timeout: 10
});

if (process.env.NODE_ENV !== "production") {
    global.postgresClient = client;
}

export const db = global.drizzleDB ?? drizzle(client);

if (process.env.NODE_ENV !== "production") {
    global.drizzleDB = db;
}
