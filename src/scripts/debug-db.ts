
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { count } from 'drizzle-orm';

async function checkDb() {
  try {
    console.log("Checking Database Connection...");
    
    const userCount = await db.select({ count: count() }).from(user);
    const sessionCount = await db.select({ count: count() }).from(session);
    
    console.log("Database Connection Successful ✅");
    console.log("User Count:", userCount[0].count);
    console.log("Session Count:", sessionCount[0].count);
    
    const allSessions = await db.query.session.findMany({
        with: {
            user: true
        },
        limit: 5
    });
    console.log("Recent Sessions:", JSON.stringify(allSessions, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Database Check Failed ❌", error);
    process.exit(1);
  }
}

checkDb();
