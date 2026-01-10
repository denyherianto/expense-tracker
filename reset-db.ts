
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const connectionString = "postgresql://finance:finance@103.59.160.178:51234/finance-db";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
    console.log("Dropping tables...");
    await db.execute(sql`DROP TABLE IF EXISTS items CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS invoices CASCADE`);
    console.log("Tables dropped successfully.");
}

main().catch(console.error).then(() => process.exit(0));
