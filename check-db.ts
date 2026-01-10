
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { invoices, items } from './src/db/schema';
import { sql } from 'drizzle-orm';

const connectionString = "postgresql://finance:finance@103.59.160.178:51234/finance-db";

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
    console.log("Checking DB Content...");
    const allInvoices = await db.select().from(invoices);
    console.log(`Total Invoices: ${allInvoices.length}`);
    
    allInvoices.forEach(inv => {
        console.log(`- Summary: ${inv.summary}`);
        console.log(`  Date: ${inv.date} (Type: ${typeof inv.date})`);
        console.log(`  Amount: ${inv.totalAmount} (Type: ${typeof inv.totalAmount})`);
        console.log(`  PocketId: ${inv.pocketId}`);
    });

    // DROP TABLES for schema reset
    await db.execute(sql`DROP TABLE IF EXISTS items CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS invoices CASCADE`);
    console.log("Tables dropped.");
}

main().catch(console.error).then(() => process.exit(0));
