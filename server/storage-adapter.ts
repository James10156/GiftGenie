import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift, UserAnalytics, InsertUserAnalytics, RecommendationFeedback, InsertRecommendationFeedback, PerformanceMetrics, InsertPerformanceMetrics, BlogPost, InsertBlogPost, GiftReminder, InsertGiftReminder } from "@shared/schema";
import { MemStorage } from "./storage";
import { DatabaseStorage } from "./db";

export interface IStorageAdapter {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined>;
  
  // Friend operations - with user context
  getFriend(id: string, userId?: string): Promise<Friend | undefined>;
  getAllFriends(userId?: string): Promise<Friend[]>;
  createFriend(friend: InsertFriend, userId?: string): Promise<Friend>;
  updateFriend(id: string, friend: Partial<InsertFriend>, userId?: string): Promise<Friend | undefined>;
  deleteFriend(id: string, userId?: string): Promise<boolean>;
  getUniqueCategories(userId?: string): Promise<string[]>;
  
  // Saved gift operations - with user context
  getSavedGift(id: string, userId?: string): Promise<SavedGift | undefined>;
  getSavedGiftsByFriend(friendId: string, userId?: string): Promise<SavedGift[]>;
  getAllSavedGifts(userId?: string): Promise<SavedGift[]>;
  createSavedGift(savedGift: InsertSavedGift, userId?: string): Promise<SavedGift>;
  deleteSavedGift(id: string, userId?: string): Promise<boolean>;

  // Analytics operations
  createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics>;
  getUserAnalytics(userId: string | "all", limit?: number): Promise<UserAnalytics[]>;
  createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback>;
  getRecommendationFeedback(userId: string | "all", limit?: number): Promise<RecommendationFeedback[]>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics>;
  getPerformanceMetrics(operation?: string, limit?: number): Promise<PerformanceMetrics[]>;

  // Blog operations
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost & { authorId: string }): Promise<BlogPost>;
  updateBlogPost(id: string, blogPost: Partial<InsertBlogPost> & { updatedAt?: string }): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Gift reminder operations
  getGiftReminder(id: string, userId?: string): Promise<GiftReminder | undefined>;
  getUserGiftReminders(userId: string): Promise<GiftReminder[]>;
  getFriendGiftReminders(friendId: string, userId?: string): Promise<GiftReminder[]>;
  createGiftReminder(reminder: InsertGiftReminder, userId?: string): Promise<GiftReminder>;
  updateGiftReminder(id: string, reminder: Partial<InsertGiftReminder>, userId?: string): Promise<GiftReminder | undefined>;
  deleteGiftReminder(id: string, userId?: string): Promise<boolean>;
  getDueReminders(beforeDate?: string): Promise<GiftReminder[]>;
  updateUserNotificationPreferences(userId: string, preferences: any): Promise<User | undefined>;
}

export class StorageAdapter implements IStorageAdapter {
  private memStorage: MemStorage;
  private databaseStorage: DatabaseStorage | null;
  private guestData: Map<string, { friends: Friend[], savedGifts: SavedGift[] }> = new Map();

  constructor() {
    this.memStorage = new MemStorage();
    // Initialize database storage if DATABASE_URL is available
    try {
      if (process.env.DATABASE_URL) {
        this.databaseStorage = new DatabaseStorage();
        console.log("✅ Database storage initialized (Neon PostgreSQL)");
      } else {
        this.databaseStorage = null;
        console.log("⚠️  Using memory storage - DATABASE_URL not configured");
      }
    } catch (error) {
      console.error("❌ Failed to initialize database storage:", error);
      this.databaseStorage = null;
    }
  }

  // Helper method to determine if this is a guest user
  private isGuestUser(userId?: string): boolean {
    return userId?.startsWith('guest_') || false;
  }

  // Helper method to get guest data storage
  private getGuestStorage(guestId: string) {
    if (!this.guestData.has(guestId)) {
      this.guestData.set(guestId, { friends: [], savedGifts: [] });
    }
    return this.guestData.get(guestId)!;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.getUser(id);
    }
    return this.memStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.getUserByUsername(username);
    }
    return this.memStorage.getUserByUsername(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    if (this.databaseStorage) {
      return this.databaseStorage.createUser(user);
    }
    return this.memStorage.createUser(user);
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.updateUserAdminStatus(id, isAdmin);
    }
    return this.memStorage.updateUserAdminStatus(id, isAdmin);
  }

  // Friend operations with user context
  async getFriend(id: string, userId?: string): Promise<Friend | undefined> {
    if (this.isGuestUser(userId)) {
      // Guest user - use in-memory storage isolated by guest ID
      const guestStorage = this.getGuestStorage(userId!);
      return guestStorage.friends.find(f => f.id === id);
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getFriendForUser(id, userId);
      } else {
        return this.databaseStorage.getFriend(id);
      }
    }
    return this.memStorage.getFriend(id);
  }

  async getAllFriends(userId?: string): Promise<Friend[]> {
    if (this.isGuestUser(userId)) {
      // Guest user - return their isolated friends
      const guestStorage = this.getGuestStorage(userId!);
      return guestStorage.friends;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getAllFriendsForUser(userId);
      } else {
        return this.databaseStorage.getAllFriends();
      }
    }
    return this.memStorage.getAllFriends();
  }

  async createFriend(friend: InsertFriend, userId?: string): Promise<Friend> {
    if (this.isGuestUser(userId)) {
      // Guest user - store in isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const newFriend: Friend = {
        id: `friend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: userId!,
        name: friend.name,
        personalityTraits: friend.personalityTraits as string[],
        interests: friend.interests as string[],
        category: friend.category || "friend",
        notes: friend.notes || null,
        country: friend.country || "United States",
        currency: friend.currency || "USD",
        profilePicture: friend.profilePicture || null,
        gender: friend.gender || null,
        ageRange: friend.ageRange || null,
        createdAt: new Date().toISOString()
      };
      guestStorage.friends.push(newFriend);
      return newFriend;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.createFriendForUser(friend, userId);
      } else {
        return this.databaseStorage.createFriend(friend);
      }
    }
    return this.memStorage.createFriend(friend);
  }

  async updateFriend(id: string, friend: Partial<InsertFriend>, userId?: string): Promise<Friend | undefined> {
    if (this.isGuestUser(userId)) {
      // Guest user - update in isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const existingFriend = guestStorage.friends.find(f => f.id === id);
      if (existingFriend) {
        if (friend.name !== undefined) existingFriend.name = friend.name;
        if (friend.personalityTraits !== undefined) existingFriend.personalityTraits = friend.personalityTraits as string[];
        if (friend.interests !== undefined) existingFriend.interests = friend.interests as string[];
        if (friend.category !== undefined) existingFriend.category = friend.category;
        if (friend.notes !== undefined) existingFriend.notes = friend.notes || null;
        if (friend.country !== undefined) existingFriend.country = friend.country;
        if (friend.currency !== undefined) existingFriend.currency = friend.currency;
        if (friend.profilePicture !== undefined) existingFriend.profilePicture = friend.profilePicture || null;
        if (friend.gender !== undefined) existingFriend.gender = friend.gender || null;
        if (friend.ageRange !== undefined) existingFriend.ageRange = friend.ageRange || null;
        if (friend.theme !== undefined) existingFriend.theme = friend.theme || 'default';
        return existingFriend;
      }
      return undefined;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.updateFriendForUser(id, friend, userId);
      } else {
        return this.databaseStorage.updateFriend(id, friend);
      }
    }
    return this.memStorage.updateFriend(id, friend);
  }

  async deleteFriend(id: string, userId?: string): Promise<boolean> {
    if (this.isGuestUser(userId)) {
      // Guest user - delete from isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const index = guestStorage.friends.findIndex(f => f.id === id);
      if (index !== -1) {
        guestStorage.friends.splice(index, 1);
        return true;
      }
      return false;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.deleteFriendForUser(id, userId);
      } else {
        return this.databaseStorage.deleteFriend(id);
      }
    }
    return this.memStorage.deleteFriend(id);
  }

  async getUniqueCategories(userId?: string): Promise<string[]> {
    if (this.isGuestUser(userId)) {
      // Guest user - get categories from isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const categories = new Set(guestStorage.friends.map(f => f.category));
      return Array.from(categories);
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getUniqueCategoriesForUser(userId);
      } else {
        return this.databaseStorage.getUniqueCategories();
      }
    }
    
    const friends = await this.memStorage.getAllFriends();
    const categories = new Set(friends.map(f => f.category));
    return Array.from(categories);
  }

  // Saved gift operations with user context
  async getSavedGift(id: string, userId?: string): Promise<SavedGift | undefined> {
    if (this.isGuestUser(userId)) {
      // Guest user - use in-memory storage isolated by guest ID
      const guestStorage = this.getGuestStorage(userId!);
      return guestStorage.savedGifts.find(g => g.id === id);
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getSavedGiftForUser(id, userId);
      } else {
        return this.databaseStorage.getSavedGift(id);
      }
    }
    return this.memStorage.getSavedGift(id);
  }

  async getSavedGiftsByFriend(friendId: string, userId?: string): Promise<SavedGift[]> {
    if (this.isGuestUser(userId)) {
      // Guest user - filter their saved gifts by friend ID
      const guestStorage = this.getGuestStorage(userId!);
      return guestStorage.savedGifts.filter(g => g.friendId === friendId);
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getSavedGiftsByFriendForUser(friendId, userId);
      } else {
        return this.databaseStorage.getSavedGiftsByFriend(friendId);
      }
    }
    return this.memStorage.getSavedGiftsByFriend(friendId);
  }

  async getAllSavedGifts(userId?: string): Promise<SavedGift[]> {
    if (this.isGuestUser(userId)) {
      // Guest user - return all their saved gifts
      const guestStorage = this.getGuestStorage(userId!);
      return guestStorage.savedGifts;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.getAllSavedGiftsForUser(userId);
      } else {
        return this.databaseStorage.getAllSavedGifts();
      }
    }
    return this.memStorage.getAllSavedGifts();
  }

  async createSavedGift(savedGift: InsertSavedGift, userId?: string): Promise<SavedGift> {
    if (this.isGuestUser(userId)) {
      // Guest user - store in isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const newSavedGift: SavedGift = {
        id: `saved_gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: userId!,
        friendId: savedGift.friendId,
        giftData: savedGift.giftData as any,
        createdAt: new Date().toISOString()
      };
      guestStorage.savedGifts.push(newSavedGift);
      return newSavedGift;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.createSavedGiftForUser(savedGift, userId);
      } else {
        return this.databaseStorage.createSavedGift(savedGift);
      }
    }
    return this.memStorage.createSavedGift(savedGift);
  }

  async deleteSavedGift(id: string, userId?: string): Promise<boolean> {
    if (this.isGuestUser(userId)) {
      // Guest user - delete from isolated guest storage
      const guestStorage = this.getGuestStorage(userId!);
      const index = guestStorage.savedGifts.findIndex(g => g.id === id);
      if (index !== -1) {
        guestStorage.savedGifts.splice(index, 1);
        return true;
      }
      return false;
    }
    
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.deleteSavedGiftForUser(id, userId);
      } else {
        return this.databaseStorage.deleteSavedGift(id);
      }
    }
    return this.memStorage.deleteSavedGift(id);
  }

  // Analytics operations
  async createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics> {
    if (this.databaseStorage) {
      return this.databaseStorage.createUserAnalytics(analytics, userId);
    }
    return this.memStorage.createUserAnalytics(analytics, userId);
  }

  async getUserAnalytics(userId: string | "all", limit?: number): Promise<UserAnalytics[]> {
    if (this.databaseStorage) {
      if (userId === "all") {
        return this.databaseStorage.getAllUserAnalytics(limit);
      }
      return this.databaseStorage.getUserAnalytics(userId, limit);
    }
    if (userId === "all") {
      return this.memStorage.getAllUserAnalytics(limit);
    }
    return this.memStorage.getUserAnalytics(userId, limit);
  }

  async createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback> {
    if (this.databaseStorage) {
      return this.databaseStorage.createRecommendationFeedback(feedback, userId);
    }
    return this.memStorage.createRecommendationFeedback(feedback, userId);
  }

  async getRecommendationFeedback(userId: string | "all", limit?: number): Promise<RecommendationFeedback[]> {
    if (this.databaseStorage) {
      if (userId === "all") {
        return this.databaseStorage.getAllRecommendationFeedback(limit);
      }
      return this.databaseStorage.getRecommendationFeedback(userId, limit);
    }
    if (userId === "all") {
      return this.memStorage.getAllRecommendationFeedback(limit);
    }
    return this.memStorage.getRecommendationFeedback(userId, limit);
  }

  async createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics> {
    if (this.databaseStorage) {
      return this.databaseStorage.createPerformanceMetrics(metrics, userId);
    }
    return this.memStorage.createPerformanceMetrics(metrics, userId);
  }

  async getPerformanceMetrics(operation?: string, limit?: number): Promise<PerformanceMetrics[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getPerformanceMetrics(operation, limit);
    }
    return this.memStorage.getPerformanceMetrics(operation, limit);
  }

  // Blog operations
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.getBlogPost(id);
    }
    // For memory storage, blog posts are not supported
    return undefined;
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getAllBlogPosts();
    }
    // For memory storage, return empty array
    return [];
  }

  async createBlogPost(blogPost: InsertBlogPost & { authorId: string }): Promise<BlogPost> {
    if (this.databaseStorage) {
      return this.databaseStorage.createBlogPost(blogPost);
    }
    // For memory storage, blog posts are not supported
    throw new Error("Blog posts require database storage");
  }

  async updateBlogPost(id: string, blogPost: Partial<InsertBlogPost> & { updatedAt?: string }): Promise<BlogPost | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.updateBlogPost(id, blogPost);
    }
    // For memory storage, blog posts are not supported
    return undefined;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    if (this.databaseStorage) {
      return this.databaseStorage.deleteBlogPost(id);
    }
    // For memory storage, blog posts are not supported
    return false;
  }

  // Convenience method for logging performance metrics
  async logPerformanceMetric(metrics: InsertPerformanceMetrics & { userId?: string }): Promise<PerformanceMetrics> {
    return this.createPerformanceMetrics(metrics, metrics.userId);
  }

  // Method to switch to database storage when available
  enableDatabaseStorage(databaseStorage: any) {
    this.databaseStorage = databaseStorage;
  }

  async getAllUserAnalytics(limit: number = 100): Promise<UserAnalytics[]> {
    try {
      if (this.databaseStorage) {
        const result = await this.databaseStorage.getAllUserAnalytics(limit);
        console.log('[storageAdapter.getAllUserAnalytics] result:', JSON.stringify(result, null, 2));
        return result;
      }
      const memResult = await this.memStorage.getAllUserAnalytics(limit);
      console.log('[storageAdapter.getAllUserAnalytics] memResult:', JSON.stringify(memResult, null, 2));
      return memResult;
    } catch (error) {
      console.error('[storageAdapter.getAllUserAnalytics] Error:', error);
      throw error;
    }
  }

  // Gift Reminder Methods
  async getGiftReminder(id: string, userId?: string): Promise<GiftReminder | undefined> {
    if (this.databaseStorage) {
      const reminder = await this.databaseStorage.getGiftReminder(id);
      // Check ownership if userId provided
      if (reminder && userId && reminder.userId !== userId) {
        return undefined;
      }
      return reminder;
    }
    // Guest users don't have reminders in memory storage
    return undefined;
  }

  async getUserGiftReminders(userId: string): Promise<GiftReminder[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getUserGiftReminders(userId);
    }
    // Guest users don't have reminders
    return [];
  }

  async getFriendGiftReminders(friendId: string, userId?: string): Promise<GiftReminder[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getFriendGiftReminders(friendId);
    }
    return [];
  }

  async createGiftReminder(reminder: InsertGiftReminder, userId?: string): Promise<GiftReminder> {
    if (this.databaseStorage) {
      const reminderWithUser = { ...reminder, userId: userId || reminder.userId };
      return this.databaseStorage.createGiftReminder(reminderWithUser);
    }
    throw new Error("Gift reminders require database storage");
  }

  async updateGiftReminder(id: string, reminder: Partial<InsertGiftReminder>, userId?: string): Promise<GiftReminder | undefined> {
    if (this.databaseStorage) {
      // Check ownership first
      const existing = await this.getGiftReminder(id, userId);
      if (!existing) {
        return undefined;
      }
      return this.databaseStorage.updateGiftReminder(id, reminder);
    }
    return undefined;
  }

  async deleteGiftReminder(id: string, userId?: string): Promise<boolean> {
    if (this.databaseStorage) {
      // Check ownership first
      const existing = await this.getGiftReminder(id, userId);
      if (!existing) {
        return false;
      }
      return this.databaseStorage.deleteGiftReminder(id);
    }
    return false;
  }

  async getDueReminders(beforeDate?: string): Promise<GiftReminder[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getDueReminders(beforeDate);
    }
    return [];
  }

  async updateUserNotificationPreferences(userId: string, preferences: any): Promise<User | undefined> {
    if (this.databaseStorage) {
      return this.databaseStorage.updateUserNotificationPreferences(userId, preferences);
    }
    return undefined;
  }
}

export const storageAdapter = new StorageAdapter();