'use server';

import { db } from '@/db';
import { pockets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPockets() {
  const allPockets = await db.select().from(pockets).orderBy(desc(pockets.name));
  return allPockets;
}

export async function createPocket(name: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Pocket name is required');
    }

    const [newPocket] = await db.insert(pockets).values({
      name: name.trim(),
      userId: 'demo-user', // Hardcoded for MVP
    }).returning();

    revalidatePath('/add');
    return { success: true, data: newPocket };
  } catch (error) {
    console.error('Error creating pocket:', error);
    return { success: false, error: 'Failed to create pocket' };
  }
}

export async function renamePocket(id: string, newName: string) {
  try {
    if (!newName || newName.trim() === '') {
      throw new Error('Pocket name is required');
    }

    const [updatedPocket] = await db.update(pockets)
      .set({ name: newName.trim() })
      .where(eq(pockets.id, id))
      .returning();

    revalidatePath('/');
    revalidatePath('/pockets');
    return { success: true, data: updatedPocket };
  } catch (error) {
    console.error('Error renaming pocket:', error);
    return { success: false, error: 'Failed to rename pocket' };
  }
}

export async function deletePocket(id: string) {
  try {
    // Optional: Check if used in invoices?
    // For now, let's assume we can delete and it might cascade or set null depending on schema
    // Schema says: pocketId uuid reference pockets.id. Default cascade behavior isn't set in drizzle schema explicitly for delete?
    // Actually in schema.ts: `pocketId: uuid('pocket_id').references(() => pockets.id)` -> default is NO ACTION/RESTRICT usually in PG.
    // Let's update schema to cascade or we just delete. If there are invoices, it might fail.
    // Let's try deleting.
    
    await db.delete(pockets).where(eq(pockets.id, id));

    revalidatePath('/');
    revalidatePath('/pockets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting pocket:', error);
    return { success: false, error: 'Failed to delete pocket' };
  }
}
