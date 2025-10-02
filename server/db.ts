import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, isNull } from "drizzle-orm";
import { users, friends, savedGifts, userAnalytics, recommendationFeedback, performanceMetrics, blogPosts } from "@shared/schema";
import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift, UserAnalytics, InsertUserAnalytics, RecommendationFeedback, InsertRecommendationFeedback, PerformanceMetrics, InsertPerformanceMetrics, BlogPost, InsertBlogPost } from "@shared/schema";
import { IStorage } from "./storage";

const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;
const db = sql ? drizzle(sql) : null;

function ensureDatabase<T>(operation: () => Promise<T>): Promise<T> {
  if (!db) {
    throw new Error("Database connection is not configured. Set DATABASE_URL to enable database storage.");
  }
  return operation();
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return ensureDatabase(async () => {
      const result = await db!.insert(users).values(user).returning();
      return result[0];
    });
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.update(users)
        .set({ isAdmin })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    });
  }

  // For guest mode (no userId)
  async getFriend(id: string): Promise<Friend | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(friends).where(eq(friends.id, id)).limit(1);
      return result[0];
    });
  }

  // For authenticated users
  async getFriendForUser(id: string, userId: string): Promise<Friend | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(friends)
        .where(and(eq(friends.id, id), eq(friends.userId, userId)))
        .limit(1);
      return result[0];
    });
  }

  async getAllFriends(): Promise<Friend[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(friends).where(isNull(friends.userId));
      return result;
    });
  }

  async getAllFriendsForUser(userId: string): Promise<Friend[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(friends).where(eq(friends.userId, userId));
      return result;
    });
  }

  async createFriend(friend: InsertFriend): Promise<Friend> {
    return ensureDatabase(async () => {
      const result = await db!.insert(friends).values({
        name: friend.name,
        personalityTraits: friend.personalityTraits as string[],
        interests: friend.interests as string[],
        category: friend.category || "friend",
        notes: friend.notes,
        country: friend.country,
        currency: friend.currency,
        profilePicture: friend.profilePicture,
        gender: friend.gender,
        ageRange: friend.ageRange,
      }).returning();
      return result[0];
    });
  }

  async createFriendForUser(friend: InsertFriend, userId: string): Promise<Friend> {
    return ensureDatabase(async () => {
      const result = await db!.insert(friends).values({
        userId,
        name: friend.name,
        personalityTraits: friend.personalityTraits as string[],
        interests: friend.interests as string[],
        category: friend.category || "friend",
        notes: friend.notes,
        country: friend.country,
        currency: friend.currency,
        profilePicture: friend.profilePicture,
        gender: friend.gender,
        ageRange: friend.ageRange,
      }).returning();
      return result[0];
    });
  }

  async updateFriend(id: string, friend: Partial<InsertFriend>): Promise<Friend | undefined> {
    return ensureDatabase(async () => {
      const updateData: any = {};
      if (friend.name !== undefined) updateData.name = friend.name;
      if (friend.personalityTraits !== undefined) updateData.personalityTraits = friend.personalityTraits as string[];
      if (friend.interests !== undefined) updateData.interests = friend.interests as string[];
      if (friend.category !== undefined) updateData.category = friend.category;
      if (friend.notes !== undefined) updateData.notes = friend.notes;
      if (friend.country !== undefined) updateData.country = friend.country;
      if (friend.currency !== undefined) updateData.currency = friend.currency;
      if (friend.profilePicture !== undefined) updateData.profilePicture = friend.profilePicture;
      if (friend.gender !== undefined) updateData.gender = friend.gender;
      if (friend.ageRange !== undefined) updateData.ageRange = friend.ageRange;
      if (friend.theme !== undefined) updateData.theme = friend.theme;
      
      const result = await db!.update(friends)
        .set(updateData)
        .where(eq(friends.id, id))
        .returning();
      return result[0];
    });
  }

  async updateFriendForUser(id: string, friend: Partial<InsertFriend>, userId: string): Promise<Friend | undefined> {
    return ensureDatabase(async () => {
      const updateData: any = {};
      if (friend.name !== undefined) updateData.name = friend.name;
      if (friend.personalityTraits !== undefined) updateData.personalityTraits = friend.personalityTraits as string[];
      if (friend.interests !== undefined) updateData.interests = friend.interests as string[];
      if (friend.category !== undefined) updateData.category = friend.category;
      if (friend.notes !== undefined) updateData.notes = friend.notes;
      if (friend.country !== undefined) updateData.country = friend.country;
      if (friend.currency !== undefined) updateData.currency = friend.currency;
      if (friend.profilePicture !== undefined) updateData.profilePicture = friend.profilePicture;
      if (friend.gender !== undefined) updateData.gender = friend.gender;
      if (friend.ageRange !== undefined) updateData.ageRange = friend.ageRange;
      if (friend.theme !== undefined) updateData.theme = friend.theme;
      
      const result = await db!.update(friends)
        .set(updateData)
        .where(and(eq(friends.id, id), eq(friends.userId, userId)))
        .returning();
      return result[0];
    });
  }

  async deleteFriend(id: string): Promise<boolean> {
    return ensureDatabase(async () => {
      const result = await db!.delete(friends).where(eq(friends.id, id)).returning();
      return result.length > 0;
    });
  }

  async deleteFriendForUser(id: string, userId: string): Promise<boolean> {
    return ensureDatabase(async () => {
      const result = await db!.delete(friends)
        .where(and(eq(friends.id, id), eq(friends.userId, userId)))
        .returning();
      return result.length > 0;
    });
  }

  async getUniqueCategories(): Promise<string[]> {
    return ensureDatabase(async () => {
      // For guest mode - get categories from friends where userId is null
      const result = await db!.selectDistinct({ category: friends.category })
        .from(friends)
        .where(isNull(friends.userId));
      return result.map(r => r.category);
    });
  }

  async getUniqueCategoriesForUser(userId: string): Promise<string[]> {
    return ensureDatabase(async () => {
      const result = await db!.selectDistinct({ category: friends.category })
        .from(friends)
        .where(eq(friends.userId, userId));
      return result.map(r => r.category);
    });
  }

  async getSavedGift(id: string): Promise<SavedGift | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts).where(eq(savedGifts.id, id)).limit(1);
      return result[0];
    });
  }

  async getSavedGiftForUser(id: string, userId: string): Promise<SavedGift | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts)
        .where(and(eq(savedGifts.id, id), eq(savedGifts.userId, userId)))
        .limit(1);
      return result[0];
    });
  }

  async getSavedGiftsByFriend(friendId: string): Promise<SavedGift[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts).where(eq(savedGifts.friendId, friendId));
      return result;
    });
  }

  async getSavedGiftsByFriendForUser(friendId: string, userId: string): Promise<SavedGift[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts)
        .where(and(eq(savedGifts.friendId, friendId), eq(savedGifts.userId, userId)));
      return result;
    });
  }

  async getAllSavedGifts(): Promise<SavedGift[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts).where(isNull(savedGifts.userId));
      return result;
    });
  }

  async getAllSavedGiftsForUser(userId: string): Promise<SavedGift[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(savedGifts).where(eq(savedGifts.userId, userId));
      return result;
    });
  }

  async createSavedGift(savedGift: InsertSavedGift): Promise<SavedGift> {
    return ensureDatabase(async () => {
      const result = await db!.insert(savedGifts).values({
        friendId: savedGift.friendId,
        giftData: savedGift.giftData as any,
      }).returning();
      return result[0];
    });
  }

  async createSavedGiftForUser(savedGift: InsertSavedGift, userId: string): Promise<SavedGift> {
    return ensureDatabase(async () => {
      const result = await db!.insert(savedGifts).values({
        userId,
        friendId: savedGift.friendId,
        giftData: savedGift.giftData as any,
      }).returning();
      return result[0];
    });
  }

  async deleteSavedGift(id: string): Promise<boolean> {
    return ensureDatabase(async () => {
      const result = await db!.delete(savedGifts).where(eq(savedGifts.id, id)).returning();
      return result.length > 0;
    });
  }

  async deleteSavedGiftForUser(id: string, userId: string): Promise<boolean> {
    return ensureDatabase(async () => {
      const result = await db!.delete(savedGifts)
        .where(and(eq(savedGifts.id, id), eq(savedGifts.userId, userId)))
        .returning();
      return result.length > 0;
    });
  }

  // Analytics methods
  async createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics> {
    return ensureDatabase(async () => {
      const result = await db!.insert(userAnalytics).values({
        userId: userId || null,
        sessionId: analytics.sessionId,
        eventType: analytics.eventType,
        eventData: analytics.eventData as any,
        userAgent: analytics.userAgent,
        ipAddress: analytics.ipAddress,
      }).returning();
      return result[0];
    });
  }

  async getUserAnalytics(userId: string, limit: number = 100): Promise<UserAnalytics[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(userAnalytics)
        .where(eq(userAnalytics.userId, userId))
        .orderBy(userAnalytics.timestamp)
        .limit(limit);
      return result;
    });
  }

  async getAllUserAnalytics(limit: number = 100): Promise<UserAnalytics[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(userAnalytics)
        .orderBy(userAnalytics.timestamp)
        .limit(limit);
      return result;
    });
  }

  async createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback> {
    // Debug: log incoming feedback payload
    console.log('createRecommendationFeedback payload:', JSON.stringify(feedback, null, 2));
    let giftName = null;
    // Robust extraction: always try to get giftName from recommendationData
    if (feedback.recommendationData) {
      let recData = feedback.recommendationData;
      if (typeof recData === 'string') {
        try {
          recData = JSON.parse(recData);
        } catch (e) {
          recData = {};
        }
      }
      if (recData && recData.giftName) {
        giftName = recData.giftName;
      }
    }
    if (!giftName) {
      console.error('Feedback insert failed: gift_name could not be extracted from recommendationData:', feedback.recommendationData);
      throw new Error('gift_name is required for feedback');
    }
    return ensureDatabase(async () => {
      const result = await db!.insert(recommendationFeedback).values({
        userId: userId || null,
        friendId: feedback.friendId,
        gift_name: giftName, // <-- always set from extracted value
        recommendationData: feedback.recommendationData as any,
        rating: feedback.rating,
        feedback: feedback.feedback,
        helpful: feedback.helpful,
        purchased: feedback.purchased,
      }).returning();
      return result[0];
    });
  }

  async getRecommendationFeedback(userId: string, limit: number = 100): Promise<RecommendationFeedback[]> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(recommendationFeedback)
        .where(eq(recommendationFeedback.userId, userId))
        .orderBy(recommendationFeedback.createdAt)
        .limit(limit);
      return result;
    });
  }

  async getAllRecommendationFeedback(limit: number = 100): Promise<RecommendationFeedback[]> {
    return ensureDatabase(async () => {
      const result = await db!.select({
        id: recommendationFeedback.id,
        userId: recommendationFeedback.userId,
        friendId: recommendationFeedback.friendId,
        recommendationData: recommendationFeedback.recommendationData,
        rating: recommendationFeedback.rating,
        feedback: recommendationFeedback.feedback,
        helpful: recommendationFeedback.helpful,
        purchased: recommendationFeedback.purchased,
        createdAt: recommendationFeedback.createdAt,
        // Add other valid columns as needed
      }).from(recommendationFeedback)
        .orderBy(recommendationFeedback.createdAt)
        .limit(limit);
      // Defensive: filter out any undefined/null rows and ensure all fields exist
      return result.filter(row => row && typeof row === 'object' && row.id && row.userId !== undefined && row.friendId !== undefined);
    });
  }

  async createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics> {
    return ensureDatabase(async () => {
      const result = await db!.insert(performanceMetrics).values({
        userId: userId || null,
        operation: metrics.operation,
        responseTime: metrics.responseTime,
        success: metrics.success,
        errorMessage: metrics.errorMessage,
        metadata: metrics.metadata as any,
      }).returning();
      return result[0];
    });
  }

  async getPerformanceMetrics(operation?: string, limit: number = 100): Promise<PerformanceMetrics[]> {
    return ensureDatabase(async () => {
      if (operation) {
        const result = await db!.select({
          id: performanceMetrics.id,
          userId: performanceMetrics.userId,
          operation: performanceMetrics.operation,
          responseTime: performanceMetrics.responseTime,
          success: performanceMetrics.success,
          errorMessage: performanceMetrics.errorMessage,
          metadata: performanceMetrics.metadata,
          timestamp: performanceMetrics.timestamp
        }).from(performanceMetrics)
          .where(eq(performanceMetrics.operation, operation))
          .orderBy(performanceMetrics.timestamp)
          .limit(limit);
        return result;
      } else {
        const result = await db!.select({
          id: performanceMetrics.id,
          userId: performanceMetrics.userId,
          operation: performanceMetrics.operation,
          responseTime: performanceMetrics.responseTime,
          success: performanceMetrics.success,
          errorMessage: performanceMetrics.errorMessage,
          metadata: performanceMetrics.metadata,
          timestamp: performanceMetrics.timestamp
        }).from(performanceMetrics)
          .orderBy(performanceMetrics.timestamp)
          .limit(limit);
        return result;
      }
    });
  }

  // Blog operations
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
      return result[0];
    });
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return ensureDatabase(async () => {
      const result = await db!.select()
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(eq(blogPosts.published, true))
        .orderBy(blogPosts.createdAt);
      
      return result.map(row => ({
        ...row.blog_posts,
        author: row.users?.username || 'Unknown'
      })) as BlogPost[];
    });
  }

  async createBlogPost(blogPost: InsertBlogPost & { authorId: string }): Promise<BlogPost> {
    return ensureDatabase(async () => {
      const result = await db!.insert(blogPosts).values(blogPost).returning();
      const post = result[0];
      
      // Get author name
      const author = await this.getUser(post.authorId);
      return {
        ...post,
        author: author?.username || 'Unknown'
      } as BlogPost;
    });
  }

  async updateBlogPost(id: string, blogPost: Partial<InsertBlogPost> & { updatedAt?: string }): Promise<BlogPost | undefined> {
    return ensureDatabase(async () => {
      const result = await db!.update(blogPosts)
        .set(blogPost)
        .where(eq(blogPosts.id, id))
        .returning();
      
      if (result[0]) {
        const post = result[0];
        const author = await this.getUser(post.authorId);
        return {
          ...post,
          author: author?.username || 'Unknown'
        } as BlogPost;
      }
      return undefined;
    });
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return ensureDatabase(async () => {
      const result = await db!.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
      return result.length > 0;
    });
  }
}

export const databaseStorage = new DatabaseStorage();