import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, isNull } from "drizzle-orm";
import { users, friends, savedGifts } from "@shared/schema";
import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift } from "@shared/schema";
import { IStorage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // For guest mode (no userId)
  async getFriend(id: string): Promise<Friend | undefined> {
    const result = await db.select().from(friends).where(eq(friends.id, id)).limit(1);
    return result[0];
  }

  // For authenticated users
  async getFriendForUser(id: string, userId: string): Promise<Friend | undefined> {
    const result = await db.select().from(friends)
      .where(and(eq(friends.id, id), eq(friends.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getAllFriends(): Promise<Friend[]> {
    // For guest mode - return demo friends (userId is null)
    const result = await db.select().from(friends).where(isNull(friends.userId));
    return result;
  }

  async getAllFriendsForUser(userId: string): Promise<Friend[]> {
    const result = await db.select().from(friends).where(eq(friends.userId, userId));
    return result;
  }

  async createFriend(friend: InsertFriend): Promise<Friend> {
    const result = await db.insert(friends).values({
      name: friend.name,
      personalityTraits: friend.personalityTraits as string[],
      interests: friend.interests as string[],
      notes: friend.notes,
      country: friend.country,
      currency: friend.currency,
      profilePicture: friend.profilePicture,
    }).returning();
    return result[0];
  }

  async createFriendForUser(friend: InsertFriend, userId: string): Promise<Friend> {
    const result = await db.insert(friends).values({
      userId,
      name: friend.name,
      personalityTraits: friend.personalityTraits as string[],
      interests: friend.interests as string[],
      notes: friend.notes,
      country: friend.country,
      currency: friend.currency,
      profilePicture: friend.profilePicture,
    }).returning();
    return result[0];
  }

  async updateFriend(id: string, friend: Partial<InsertFriend>): Promise<Friend | undefined> {
    const updateData: any = {};
    if (friend.name !== undefined) updateData.name = friend.name;
    if (friend.personalityTraits !== undefined) updateData.personalityTraits = friend.personalityTraits as string[];
    if (friend.interests !== undefined) updateData.interests = friend.interests as string[];
    if (friend.notes !== undefined) updateData.notes = friend.notes;
    if (friend.country !== undefined) updateData.country = friend.country;
    if (friend.currency !== undefined) updateData.currency = friend.currency;
    if (friend.profilePicture !== undefined) updateData.profilePicture = friend.profilePicture;
    
    const result = await db.update(friends)
      .set(updateData)
      .where(eq(friends.id, id))
      .returning();
    return result[0];
  }

  async updateFriendForUser(id: string, friend: Partial<InsertFriend>, userId: string): Promise<Friend | undefined> {
    const updateData: any = {};
    if (friend.name !== undefined) updateData.name = friend.name;
    if (friend.personalityTraits !== undefined) updateData.personalityTraits = friend.personalityTraits as string[];
    if (friend.interests !== undefined) updateData.interests = friend.interests as string[];
    if (friend.notes !== undefined) updateData.notes = friend.notes;
    if (friend.country !== undefined) updateData.country = friend.country;
    if (friend.currency !== undefined) updateData.currency = friend.currency;
    if (friend.profilePicture !== undefined) updateData.profilePicture = friend.profilePicture;
    
    const result = await db.update(friends)
      .set(updateData)
      .where(and(eq(friends.id, id), eq(friends.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteFriend(id: string): Promise<boolean> {
    const result = await db.delete(friends).where(eq(friends.id, id)).returning();
    return result.length > 0;
  }

  async deleteFriendForUser(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(friends)
      .where(and(eq(friends.id, id), eq(friends.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getSavedGift(id: string): Promise<SavedGift | undefined> {
    const result = await db.select().from(savedGifts).where(eq(savedGifts.id, id)).limit(1);
    return result[0];
  }

  async getSavedGiftForUser(id: string, userId: string): Promise<SavedGift | undefined> {
    const result = await db.select().from(savedGifts)
      .where(and(eq(savedGifts.id, id), eq(savedGifts.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getSavedGiftsByFriend(friendId: string): Promise<SavedGift[]> {
    const result = await db.select().from(savedGifts).where(eq(savedGifts.friendId, friendId));
    return result;
  }

  async getSavedGiftsByFriendForUser(friendId: string, userId: string): Promise<SavedGift[]> {
    const result = await db.select().from(savedGifts)
      .where(and(eq(savedGifts.friendId, friendId), eq(savedGifts.userId, userId)));
    return result;
  }

  async getAllSavedGifts(): Promise<SavedGift[]> {
    const result = await db.select().from(savedGifts).where(isNull(savedGifts.userId));
    return result;
  }

  async getAllSavedGiftsForUser(userId: string): Promise<SavedGift[]> {
    const result = await db.select().from(savedGifts).where(eq(savedGifts.userId, userId));
    return result;
  }

  async createSavedGift(savedGift: InsertSavedGift): Promise<SavedGift> {
    const result = await db.insert(savedGifts).values({
      friendId: savedGift.friendId,
      giftData: savedGift.giftData as any,
    }).returning();
    return result[0];
  }

  async createSavedGiftForUser(savedGift: InsertSavedGift, userId: string): Promise<SavedGift> {
    const result = await db.insert(savedGifts).values({
      userId,
      friendId: savedGift.friendId,
      giftData: savedGift.giftData as any,
    }).returning();
    return result[0];
  }

  async deleteSavedGift(id: string): Promise<boolean> {
    const result = await db.delete(savedGifts).where(eq(savedGifts.id, id)).returning();
    return result.length > 0;
  }

  async deleteSavedGiftForUser(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(savedGifts)
      .where(and(eq(savedGifts.id, id), eq(savedGifts.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const databaseStorage = new DatabaseStorage();