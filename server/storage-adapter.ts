import type { User, InsertUser, Friend, InsertFriend, SavedGift, InsertSavedGift } from "@shared/schema";
import { MemStorage } from "./storage";

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
  private databaseStorage: any; // Will be DatabaseStorage when available

  constructor() {
    this.memStorage = new MemStorage();
    // For now, we'll use MemStorage until database is set up
    this.databaseStorage = null;
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
    if (this.databaseStorage && userId) {
      return this.databaseStorage.getFriendForUser(id, userId);
    }
    return this.memStorage.getFriend(id);
  }

  async getAllFriends(userId?: string): Promise<Friend[]> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.getAllFriendsForUser(userId);
    }
    return this.memStorage.getAllFriends();
  }

  async createFriend(friend: InsertFriend, userId?: string): Promise<Friend> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.createFriendForUser(friend, userId);
    }
    return this.memStorage.createFriend(friend);
  }

  async updateFriend(id: string, friend: Partial<InsertFriend>, userId?: string): Promise<Friend | undefined> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.updateFriendForUser(id, friend, userId);
    }
    return this.memStorage.updateFriend(id, friend);
  }

  async deleteFriend(id: string, userId?: string): Promise<boolean> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.deleteFriendForUser(id, userId);
    }
    return this.memStorage.deleteFriend(id);
  }

  // Saved gift operations with user context
  async getSavedGift(id: string, userId?: string): Promise<SavedGift | undefined> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.getSavedGiftForUser(id, userId);
    }
    return this.memStorage.getSavedGift(id);
  }

  async getSavedGiftsByFriend(friendId: string, userId?: string): Promise<SavedGift[]> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.getSavedGiftsByFriendForUser(friendId, userId);
    }
    return this.memStorage.getSavedGiftsByFriend(friendId);
  }

  async getAllSavedGifts(userId?: string): Promise<SavedGift[]> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.getAllSavedGiftsForUser(userId);
    }
    return this.memStorage.getAllSavedGifts();
  }

  async createSavedGift(savedGift: InsertSavedGift, userId?: string): Promise<SavedGift> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.createSavedGiftForUser(savedGift, userId);
    }
    return this.memStorage.createSavedGift(savedGift);
  }

  async deleteSavedGift(id: string, userId?: string): Promise<boolean> {
    if (this.databaseStorage && userId) {
      return this.databaseStorage.deleteSavedGiftForUser(id, userId);
    }
    return this.memStorage.deleteSavedGift(id);
  }

  // Method to switch to database storage when available
  enableDatabaseStorage(databaseStorage: any) {
    this.databaseStorage = databaseStorage;
  }
}

export const storageAdapter = new StorageAdapter();