import { type User, type InsertUser, type Friend, type InsertFriend, type SavedGift, type InsertSavedGift, type UserAnalytics, type InsertUserAnalytics, type RecommendationFeedback, type InsertRecommendationFeedback, type PerformanceMetrics, type InsertPerformanceMetrics, type BlogPost, type InsertBlogPost, type GiftReminder, type InsertGiftReminder } from "@shared/schema";
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

  // Blog post methods
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost & { authorId: string }): Promise<BlogPost>;
  updateBlogPost(id: string, blogPost: Partial<InsertBlogPost> & { updatedAt?: string }): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Gift reminder methods
  getGiftReminder(id: string): Promise<GiftReminder | undefined>;
  getUserGiftReminders(userId: string): Promise<GiftReminder[]>;
  getFriendGiftReminders(friendId: string): Promise<GiftReminder[]>;
  createGiftReminder(reminder: InsertGiftReminder): Promise<GiftReminder>;
  updateGiftReminder(id: string, reminder: Partial<InsertGiftReminder>): Promise<GiftReminder | undefined>;
  deleteGiftReminder(id: string): Promise<boolean>;
  getDueReminders(beforeDate?: string): Promise<GiftReminder[]>; // For scheduled job processing
  updateUserNotificationPreferences(userId: string, preferences: any): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private friends: Map<string, Friend>;
  private savedGifts: Map<string, SavedGift>;
  private userAnalytics: Map<string, UserAnalytics>;
  private recommendationFeedback: Map<string, RecommendationFeedback>;
  private performanceMetrics: Map<string, PerformanceMetrics>;
  private blogPosts: Map<string, BlogPost>;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.savedGifts = new Map();
    this.userAnalytics = new Map();
    this.recommendationFeedback = new Map();
    this.performanceMetrics = new Map();
    this.blogPosts = new Map();
    
    // Add some initial demo friends outside of test runs
    if (process.env.NODE_ENV !== 'test') {
      this.initializeDemoData();
    }
  }

  private initializeDemoData() {
    const demoFriends: Friend[] = [
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Sherlock Holmes",
        personalityTraits: ["Analytical", "Observant", "Logical"],
        interests: ["Mystery solving", "Violin", "Chemistry"],
        category: "friend",
        notes: "The world's greatest consulting detective, known for his keen deductive reasoning and attention to detail",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418318/giftgenie/demo-friends/sherlock-holmes.svg",
        gender: "Male",
        ageRange: "31-35",
        theme: "elegant",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Snow White",
        personalityTraits: ["Kind", "Gentle", "Optimistic"],
        interests: ["Nature", "Cooking", "Animals"],
        category: "friend",
        notes: "Known for her pure heart and ability to befriend all woodland creatures. Loves baking and forest walks",
        country: "Germany",
        currency: "EUR",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418320/giftgenie/demo-friends/snow-white.svg",
        gender: "Female",
        ageRange: "18-25",
        theme: "cherry-blossom",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Tarzan",
        personalityTraits: ["Adventurous", "Strong", "Protective"],
        interests: ["Jungle exploration", "Wildlife", "Vine swinging"],
        category: "friend",
        notes: "Lord of the jungle who communicates with animals and protects the forest. Incredibly athletic and brave",
        country: "United States",
        currency: "USD",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418322/giftgenie/demo-friends/tarzan.svg",
        gender: "Male",
        ageRange: "26-30",
        theme: "jungle-vibes",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Robin Hood",
        personalityTraits: ["Heroic", "Generous", "Clever"],
        interests: ["Archery", "Forest life", "Justice"],
        category: "friend",
        notes: "The legendary outlaw who steals from the rich to help the poor. Master archer and leader of the Merry Men",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418324/giftgenie/demo-friends/robin-hood.svg",
        gender: "Male",
        ageRange: "26-30",
        theme: "forest-green",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Sleeping Beauty",
        personalityTraits: ["Graceful", "Patient", "Dreamy"],
        interests: ["Dancing", "Spinning", "Garden walks"],
        category: "friend",
        notes: "Known as Aurora or Briar Rose, she has a gift for bringing beauty and peace wherever she goes",
        country: "France",
        currency: "EUR",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418326/giftgenie/demo-friends/sleeping-beauty.svg",
        gender: "Female",
        ageRange: "18-25",
        theme: "rose-gold",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
      {
        id: randomUUID(),
        userId: null, // Guest mode - no user ID
        name: "Peter Pan",
        personalityTraits: ["Playful", "Brave", "Mischievous"],
        interests: ["Flying", "Adventure", "Storytelling"],
        category: "friend",
        notes: "The boy who never grows up, leader of the Lost Boys in Neverland. Can fly and loves exciting adventures",
        country: "United Kingdom",
        currency: "GBP",
        profilePicture: "https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418329/giftgenie/demo-friends/peter-pan.svg",
        gender: "Male",
        ageRange: "18-25",
        theme: "forest-green",
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

  async getAllUserAnalytics(limit: number = 100): Promise<UserAnalytics[]> {
    return Array.from(this.userAnalytics.values())
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

  async getAllRecommendationFeedback(limit: number = 100): Promise<RecommendationFeedback[]> {
    return Array.from(this.recommendationFeedback.values())
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

  // Blog post methods
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createBlogPost(blogPost: InsertBlogPost & { authorId: string }): Promise<BlogPost> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newPost: BlogPost = {
      id,
      ...blogPost,
      createdAt: now,
      updatedAt: now,
    };
    this.blogPosts.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: string, updateData: Partial<InsertBlogPost> & { updatedAt?: string }): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) {
      return undefined;
    }

    const updatedPost: BlogPost = {
      ...existingPost,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
}

export const storage = new MemStorage();
