import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  personalityTraits: jsonb("personality_traits").$type<string[]>().notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  category: text("category").notNull().default("friend"),
  notes: text("notes"),
  country: text("country").notNull().default("United States"),
  currency: text("currency").notNull().default("USD"),
  profilePicture: text("profile_picture"),
  gender: text("gender"), // Can be "Male", "Female", or null
  ageRange: text("age_range"), // Can be "18-25", "26-30", "31-35", etc., or null
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const savedGifts = pgTable("saved_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  friendId: varchar("friend_id").notNull().references(() => friends.id, { onDelete: "cascade" }),
  giftData: jsonb("gift_data").$type<{
    name: string;
    description: string;
    price: string;
    matchPercentage: number;
    image: string;
    shops: Array<{
      name: string;
      price: string;
      inStock: boolean;
      url: string;
    }>;
  }>().notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Analytics Tables
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(), // 'page_view', 'click', 'search', 'generate_gifts', etc.
  eventData: jsonb("event_data").$type<Record<string, any>>(), // Flexible data for different event types
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

export const recommendationFeedback = pgTable("recommendation_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  friendId: varchar("friend_id").references(() => friends.id, { onDelete: "cascade" }),
  gift_name: text("gift_name").notNull(), // <-- Add this column to match DB
  recommendationData: jsonb("recommendation_data").$type<{
    giftName: string;
    price: string;
    matchPercentage: number;
    generationParams: {
      budget: number;
      currency: string;
      personalityTraits: string[];
      interests: string[];
    };
  }>().notNull(),
  rating: integer("rating").notNull(), // 1-5 star rating or -1 for thumbs down, 1 for thumbs up
  feedback: text("feedback"), // Optional detailed feedback
  helpful: boolean("helpful"), // Whether user found the recommendation helpful
  purchased: boolean("purchased").default(false), // Whether they actually bought this gift
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  operation: text("operation").notNull(), // 'ai_recommendation', 'image_search', 'shop_search', etc.
  responseTime: integer("response_time_ms").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Ensure metadata is a plain object
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  published: boolean("published").notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
}).partial({ isAdmin: true }); // Make isAdmin optional

// For registration, only require username and password
export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  name: true,
  personalityTraits: true,
  interests: true,
  category: true,
  notes: true,
  country: true,
  currency: true,
  profilePicture: true,
  gender: true,
  ageRange: true,
});

export const insertSavedGiftSchema = createInsertSchema(savedGifts).pick({
  friendId: true,
  giftData: true,
});

export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).pick({
  sessionId: true,
  eventType: true,
  eventData: true,
  userAgent: true,
  ipAddress: true,
});

export const insertRecommendationFeedbackSchema = createInsertSchema(recommendationFeedback).pick({
  friendId: true,
  recommendationData: true,
  rating: true,
  feedback: true,
  helpful: true,
  purchased: true,
  gift_name: true, // <-- Add this to match schema
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).pick({
  operation: true,
  responseTime: true,
  success: true,
  errorMessage: true,
  metadata: z.record(z.string(), z.any()), // Ensure metadata is a plain object
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  content: true,
  excerpt: true,
  published: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertSavedGift = z.infer<typeof insertSavedGiftSchema>;
export type SavedGift = typeof savedGifts.$inferSelect;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertRecommendationFeedback = z.infer<typeof insertRecommendationFeedbackSchema>;
export type RecommendationFeedback = typeof recommendationFeedback.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export interface GiftRecommendation {
  name: string;
  description: string;
  price: string;
  matchPercentage: number;
  matchingTraits: string[];
  image: string;
  shops: Array<{
    name: string;
    price: string;
    inStock: boolean;
    url: string;
  }>;
}
