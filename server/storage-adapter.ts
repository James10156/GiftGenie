import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift, UserAnalytics, InsertUserAnalytics, RecommendationFeedback, InsertRecommendationFeedback, PerformanceMetrics, InsertPerformanceMetrics } from "@shared/schema";
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
  
  // Saved gift operations - with user context
  getSavedGift(id: string, userId?: string): Promise<SavedGift | undefined>;
  getSavedGiftsByFriend(friendId: string, userId?: string): Promise<SavedGift[]>;
  getAllSavedGifts(userId?: string): Promise<SavedGift[]>;
  createSavedGift(savedGift: InsertSavedGift, userId?: string): Promise<SavedGift>;
  deleteSavedGift(id: string, userId?: string): Promise<boolean>;

  // Analytics operations
  createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics>;
  getUserAnalytics(userId: string, limit?: number): Promise<UserAnalytics[]>;
  createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback>;
  getRecommendationFeedback(userId: string, limit?: number): Promise<RecommendationFeedback[]>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics>;
  getPerformanceMetrics(operation?: string, limit?: number): Promise<PerformanceMetrics[]>;
}

export class StorageAdapter implements IStorageAdapter {
  private memStorage: MemStorage;
  private databaseStorage: DatabaseStorage | null;

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
    if (this.databaseStorage) {
      if (userId) {
        return this.databaseStorage.deleteFriendForUser(id, userId);
      } else {
        return this.databaseStorage.deleteFriend(id);
      }
    }
    return this.memStorage.deleteFriend(id);
  }

  // Saved gift operations with user context
  async getSavedGift(id: string, userId?: string): Promise<SavedGift | undefined> {
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

  async getUserAnalytics(userId: string, limit?: number): Promise<UserAnalytics[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getUserAnalytics(userId, limit);
    }
    return this.memStorage.getUserAnalytics(userId, limit);
  }

  async createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback> {
    if (this.databaseStorage) {
      return this.databaseStorage.createRecommendationFeedback(feedback, userId);
    }
    return this.memStorage.createRecommendationFeedback(feedback, userId);
  }

  async getRecommendationFeedback(userId: string, limit?: number): Promise<RecommendationFeedback[]> {
    if (this.databaseStorage) {
      return this.databaseStorage.getRecommendationFeedback(userId, limit);
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

  // Convenience method for logging performance metrics
  async logPerformanceMetric(metrics: InsertPerformanceMetrics & { userId?: string }): Promise<PerformanceMetrics> {
    return this.createPerformanceMetrics(metrics, metrics.userId);
  }

  // Method to switch to database storage when available
  enableDatabaseStorage(databaseStorage: any) {
    this.databaseStorage = databaseStorage;
  }
}

export const storageAdapter = new StorageAdapter();