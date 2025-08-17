import { type User, type InsertUser, type Friend, type InsertFriend, type SavedGift, type InsertSavedGift } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFriend(id: string): Promise<Friend | undefined>;
  getAllFriends(): Promise<Friend[]>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: string, friend: Partial<InsertFriend>): Promise<Friend | undefined>;
  deleteFriend(id: string): Promise<boolean>;
  
  getSavedGift(id: string): Promise<SavedGift | undefined>;
  getSavedGiftsByFriend(friendId: string): Promise<SavedGift[]>;
  getAllSavedGifts(): Promise<SavedGift[]>;
  createSavedGift(savedGift: InsertSavedGift): Promise<SavedGift>;
  deleteSavedGift(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private friends: Map<string, Friend>;
  private savedGifts: Map<string, SavedGift>;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.savedGifts = new Map();
    
    // Add some initial demo friends
    this.initializeDemoData();
  }

  private initializeDemoData() {
    const demoFriends: Friend[] = [
      {
        id: randomUUID(),
        name: "Alex Johnson",
        personalityTraits: ["Creative", "Outdoorsy", "Thoughtful"],
        interests: ["Art", "Hiking", "Photography"],
        notes: "Loves outdoor art sessions and nature photography",
        country: "United States",
        currency: "USD",
        profilePicture: null,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      },
      {
        id: randomUUID(),
        name: "Sarah Chen",
        personalityTraits: ["Artistic", "Tech-savvy", "Innovative"],
        interests: ["Digital Art", "Gadgets", "Gaming"],
        notes: "Always exploring new digital art tools and techniques",
        country: "Canada",
        currency: "CAD",
        profilePicture: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
      },
      {
        id: randomUUID(),
        name: "Mike Torres",
        personalityTraits: ["Sporty", "Social", "Energetic"],
        interests: ["Basketball", "Fitness", "Music"],
        notes: "Very active, loves team sports and working out",
        country: "United States",
        currency: "USD",
        profilePicture: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
    ];

    demoFriends.forEach(friend => {
      this.friends.set(friend.id, friend);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFriend(id: string): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async getAllFriends(): Promise<Friend[]> {
    return Array.from(this.friends.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const id = randomUUID();
    const friend: Friend = { 
      ...insertFriend, 
      id,
      createdAt: new Date().toISOString()
    };
    this.friends.set(id, friend);
    return friend;
  }

  async updateFriend(id: string, updateData: Partial<InsertFriend>): Promise<Friend | undefined> {
    const existingFriend = this.friends.get(id);
    if (!existingFriend) return undefined;
    
    const updatedFriend: Friend = { ...existingFriend, ...updateData };
    this.friends.set(id, updatedFriend);
    return updatedFriend;
  }

  async deleteFriend(id: string): Promise<boolean> {
    return this.friends.delete(id);
  }

  async getSavedGift(id: string): Promise<SavedGift | undefined> {
    return this.savedGifts.get(id);
  }

  async getSavedGiftsByFriend(friendId: string): Promise<SavedGift[]> {
    return Array.from(this.savedGifts.values()).filter(gift => gift.friendId === friendId);
  }

  async getAllSavedGifts(): Promise<SavedGift[]> {
    return Array.from(this.savedGifts.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createSavedGift(insertSavedGift: InsertSavedGift): Promise<SavedGift> {
    const id = randomUUID();
    const savedGift: SavedGift = { 
      ...insertSavedGift, 
      id,
      createdAt: new Date().toISOString()
    };
    this.savedGifts.set(id, savedGift);
    return savedGift;
  }

  async deleteSavedGift(id: string): Promise<boolean> {
    return this.savedGifts.delete(id);
  }
}

export const storage = new MemStorage();
