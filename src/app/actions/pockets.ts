'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { pockets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPockets() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const allPockets = await db.select().from(pockets)
    .where(eq(pockets.userId, session.user.id))
    .orderBy(desc(pockets.name));
  return allPockets;
}

export async function createPocket(name: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    if (!name || name.trim() === '') {
      throw new Error('Pocket name is required');
    }

    const [newPocket] = await db.insert(pockets).values({
      name: name.trim(),
      userId: session.user.id,
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    if (!newName || newName.trim() === '') {
      throw new Error('Pocket name is required');
    }

    // Verify ownership
    const existing = await db.query.pockets.findFirst({
      where: and(eq(pockets.id, id), eq(pockets.userId, session.user.id))
    });

    if (!existing) throw new Error('Pocket not found or unauthorized');

    const [updatedPocket] = await db.update(pockets)
      .set({ name: newName.trim() })
      .where(eq(pockets.id, id))
      .returning();

    revalidatePath('/');
    revalidatePath('/');
    return { success: true, data: updatedPocket };
  } catch (error) {
    console.error('Error renaming pocket:', error);
    return { success: false, error: 'Failed to rename pocket' };
  }
}

export async function deletePocket(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    // Verify ownership
    const existing = await db.query.pockets.findFirst({
      where: and(eq(pockets.id, id), eq(pockets.userId, session.user.id))
    });

    if (!existing) throw new Error('Pocket not found or unauthorized');

    await db.delete(pockets).where(eq(pockets.id, id));

    revalidatePath('/');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting pocket:', error);
    return { success: false, error: 'Failed to delete pocket' };
  }
}
