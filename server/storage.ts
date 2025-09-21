import { type User, type InsertUser, type Friend, type InsertFriend, type SavedGift, type InsertSavedGift, type UserAnalytics, type InsertUserAnalytics, type RecommendationFeedback, type InsertRecommendationFeedback, type PerformanceMetrics, type InsertPerformanceMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined>;
  
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

  // Analytics methods
  createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics>;
  getUserAnalytics(userId: string, limit?: number): Promise<UserAnalytics[]>;
  createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback>;
  getRecommendationFeedback(userId: string, limit?: number): Promise<RecommendationFeedback[]>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics>;
  getPerformanceMetrics(operation?: string, limit?: number): Promise<PerformanceMetrics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private friends: Map<string, Friend>;
  private savedGifts: Map<string, SavedGift>;
  private userAnalytics: Map<string, UserAnalytics>;
  private recommendationFeedback: Map<string, RecommendationFeedback>;
  private performanceMetrics: Map<string, PerformanceMetrics>;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.savedGifts = new Map();
    this.userAnalytics = new Map();
    this.recommendationFeedback = new Map();
    this.performanceMetrics = new Map();
    
    // Add some initial demo friends
    this.initializeDemoData();
  }

  private initializeDemoData() {
    const demoFriends: Friend[] = [
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Alex Johnson",
        personalityTraits: ["Creative", "Outdoorsy", "Thoughtful"],
        interests: ["Art", "Hiking", "Photography"],
        notes: "Loves outdoor art sessions and nature photography",
        country: "United States",
        currency: "USD",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Sarah Chen",
        personalityTraits: ["Artistic", "Tech-savvy", "Innovative"],
        interests: ["Digital Art", "Gadgets", "Gaming"],
        notes: "Always exploring new digital art tools and techniques",
        country: "Canada",
        currency: "CAD",
        profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Mike Torres",
        personalityTraits: ["Sporty", "Social", "Energetic"],
        interests: ["Basketball", "Fitness", "Music"],
        notes: "Very active, loves team sports and working out",
        country: "United States",
        currency: "USD",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Mariel Cabrera",
        personalityTraits: ["Empathetic", "Kind", "Thoughtful"],
        interests: ["Fashion", "Gaming", "Food"],
        notes: "Loves luxury brands like Gucci and Prada",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://lh3.googleusercontent.com/d/1NMP8bNLZxORMwEDqI1H53FDeUVJA0SMg",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Danielle Quintana",
        personalityTraits: ["Quiet", "Thoughtful", "Reliable"],
        interests: ["Running", "Tennis", "Cooking"],
        notes: "Loves designer glasses and athletic activities",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://lh3.googleusercontent.com/d/19CGhqEKtXxSOLdL1FTg1KYvwZE2Aychb",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Gian de Belen",
        personalityTraits: ["Curious", "Analytical", "Romantic"],
        interests: ["Gaming", "Anime", "Badminton"],
        notes: "Really loves Gundam models and anime culture",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://lh3.googleusercontent.com/d/1LvyJQAyeuQK9PkDfqtndRSg92PxPcxbG",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
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
    const user: User = { ...insertUser, id, isAdmin: insertUser.isAdmin || false };
    this.users.set(id, user);
    return user;
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, isAdmin };
    this.users.set(id, updatedUser);
    return updatedUser;
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
      id,
      userId: null, // Guest mode
      name: insertFriend.name,
      personalityTraits: insertFriend.personalityTraits as string[],
      interests: insertFriend.interests as string[],
      category: insertFriend.category || "friend",
      notes: insertFriend.notes ?? null,
      country: insertFriend.country || '',
      currency: insertFriend.currency || 'USD',
      profilePicture: insertFriend.profilePicture ?? null,
      createdAt: new Date().toISOString()
    };
    this.friends.set(id, friend);
    return friend;
  }

  async updateFriend(id: string, updateData: Partial<InsertFriend>): Promise<Friend | undefined> {
    const existingFriend = this.friends.get(id);
    if (!existingFriend) return undefined;
    
    const updatedFriend: Friend = { 
      ...existingFriend, 
      ...updateData,
      // Ensure proper types for optional fields
      category: updateData.category !== undefined ? updateData.category || "friend" : existingFriend.category,
      notes: updateData.notes !== undefined ? updateData.notes ?? null : existingFriend.notes,
      country: updateData.country !== undefined ? updateData.country || '' : existingFriend.country,
      currency: updateData.currency !== undefined ? updateData.currency || 'USD' : existingFriend.currency,
      profilePicture: updateData.profilePicture !== undefined ? updateData.profilePicture ?? null : existingFriend.profilePicture,
      personalityTraits: updateData.personalityTraits ? updateData.personalityTraits as string[] : existingFriend.personalityTraits,
      interests: updateData.interests ? updateData.interests as string[] : existingFriend.interests
    };
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
      id,
      userId: null, // Guest mode
      friendId: insertSavedGift.friendId,
      giftData: insertSavedGift.giftData as SavedGift['giftData'],
      createdAt: new Date().toISOString()
    };
    this.savedGifts.set(id, savedGift);
    return savedGift;
  }

  async deleteSavedGift(id: string): Promise<boolean> {
    return this.savedGifts.delete(id);
  }

  // Analytics methods
  async createUserAnalytics(analytics: InsertUserAnalytics, userId?: string): Promise<UserAnalytics> {
    const id = randomUUID();
    const userAnalytics: UserAnalytics = {
      id,
      userId: userId || null,
      sessionId: analytics.sessionId,
      eventType: analytics.eventType,
      eventData: analytics.eventData || null,
      timestamp: new Date().toISOString(),
      userAgent: analytics.userAgent || null,
      ipAddress: analytics.ipAddress || null,
    };
    this.userAnalytics.set(id, userAnalytics);
    return userAnalytics;
  }

  async getUserAnalytics(userId: string, limit: number = 100): Promise<UserAnalytics[]> {
    return Array.from(this.userAnalytics.values())
      .filter(analytics => analytics.userId === userId)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, limit);
  }

  async createRecommendationFeedback(feedback: InsertRecommendationFeedback, userId?: string): Promise<RecommendationFeedback> {
    const id = randomUUID();
    const recommendationFeedback: RecommendationFeedback = {
      id,
      userId: userId || null,
      friendId: feedback.friendId || null,
      recommendationData: feedback.recommendationData as RecommendationFeedback['recommendationData'],
      rating: feedback.rating,
      feedback: feedback.feedback || null,
      helpful: feedback.helpful || null,
      purchased: feedback.purchased || false,
      createdAt: new Date().toISOString(),
    };
    this.recommendationFeedback.set(id, recommendationFeedback);
    return recommendationFeedback;
  }

  async getRecommendationFeedback(userId: string, limit: number = 100): Promise<RecommendationFeedback[]> {
    return Array.from(this.recommendationFeedback.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  }

  async createPerformanceMetrics(metrics: InsertPerformanceMetrics, userId?: string): Promise<PerformanceMetrics> {
    const id = randomUUID();
    const performanceMetrics: PerformanceMetrics = {
      id,
      userId: userId || null,
      operation: metrics.operation,
      responseTime: metrics.responseTime,
      success: metrics.success,
      errorMessage: metrics.errorMessage || null,
      metadata: metrics.metadata || null,
      timestamp: new Date().toISOString(),
    };
    this.performanceMetrics.set(id, performanceMetrics);
    return performanceMetrics;
  }

  async getPerformanceMetrics(operation?: string, limit: number = 100): Promise<PerformanceMetrics[]> {
    let metrics = Array.from(this.performanceMetrics.values());
    
    if (operation) {
      metrics = metrics.filter(metric => metric.operation === operation);
    }
    
    return metrics
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
