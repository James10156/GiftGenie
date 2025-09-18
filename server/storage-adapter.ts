import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift } from "@shared/schema";
import { MemStorage } from "./storage";
import { DatabaseStorage } from "./db";

export interface IStorageAdapter {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  // Method to switch to database storage when available
  enableDatabaseStorage(databaseStorage: any) {
    this.databaseStorage = databaseStorage;
  }
}

export const storageAdapter = new StorageAdapter();