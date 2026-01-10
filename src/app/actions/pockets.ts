'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { pockets, pocketMembers, user } from '@/db/schema';
import { eq, desc, and, or, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPockets() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  // Get pockets owned by user
  const ownedPockets = await db.select().from(pockets)
    .where(eq(pockets.userId, session.user.id));

  // Get shared pockets
  const sharedMemberships = await db.select().from(pocketMembers)
    .where(eq(pocketMembers.userId, session.user.id));

  const sharedPocketIds = sharedMemberships.map(m => m.pocketId);

  let sharedPocketsData: typeof ownedPockets = [];
  if (sharedPocketIds.length > 0) {
    sharedPocketsData = await db.select().from(pockets)
      .where(inArray(pockets.id, sharedPocketIds));
  }

  // Combine and sort
  const allPockets = [...ownedPockets, ...sharedPocketsData].sort((a, b) => a.name.localeCompare(b.name));

  // Remove duplicates just in case (though logic shouldn't produce them)
  const uniquePockets = Array.from(new Map(allPockets.map(item => [item.id, item])).values());

  return uniquePockets;
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

    revalidatePath('/');
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting pocket:', error);
    return { success: false, error: 'Failed to delete pocket' };
  }
}

export async function sharePocket(pocketId: string, email: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    // Verify ownership
    const pocket = await db.query.pockets.findFirst({
      where: and(eq(pockets.id, pocketId), eq(pockets.userId, session.user.id))
    });

    if (!pocket) {
      return { success: false, error: "Pocket not found or you are not the owner" };
    }

    // Find user by email
    const targetUser = await db.query.user.findFirst({
      where: eq(user.email, email)
    });

    if (!targetUser) {
      return { success: false, error: "User with this email not found" };
    }

    if (targetUser.id === session.user.id) {
      return { success: false, error: "You cannot share with yourself" };
    }

    // Check if already shared
    const existingMember = await db.query.pocketMembers.findFirst({
      where: and(eq(pocketMembers.pocketId, pocketId), eq(pocketMembers.userId, targetUser.id))
    });

    if (existingMember) {
      return { success: false, error: "User is already a member" };
    }

    // Add to members
    await db.insert(pocketMembers).values({
      pocketId: pocketId,
      userId: targetUser.id
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error sharing pocket:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getPocketMembers(pocketId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const members = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isOwner: sql<boolean>`${pockets.userId} = ${user.id}`
  })
    .from(pocketMembers)
    .innerJoin(user, eq(pocketMembers.userId, user.id))
    .innerJoin(pockets, eq(pocketMembers.pocketId, pockets.id))
    .where(eq(pocketMembers.pocketId, pocketId));

  // Also get the owner
  const owner = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isOwner: sql<boolean>`true`
  })
    .from(pockets)
    .innerJoin(user, eq(pockets.userId, user.id))
    .where(eq(pockets.id, pocketId));

  // Combine (Owner first)
  return [...owner, ...members];
}

export async function removeMember(pocketId: string, userId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    // Verify ownership
    const pocket = await db.query.pockets.findFirst({
      where: and(eq(pockets.id, pocketId), eq(pockets.userId, session.user.id))
    });

    if (!pocket) {
      return { success: false, error: "Unauthorized" };
    }

    await db.delete(pocketMembers)
      .where(and(eq(pocketMembers.pocketId, pocketId), eq(pocketMembers.userId, userId)));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove member" };
  }
}

