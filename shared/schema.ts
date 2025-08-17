import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  personalityTraits: jsonb("personality_traits").$type<string[]>().notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  notes: text("notes"),
  country: text("country").notNull().default("United States"),
  currency: text("currency").notNull().default("USD"),
  profilePicture: text("profile_picture"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const savedGifts = pgTable("saved_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  friendId: varchar("friend_id").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  name: true,
  personalityTraits: true,
  interests: true,
  notes: true,
  country: true,
  currency: true,
  profilePicture: true,
});

export const insertSavedGiftSchema = createInsertSchema(savedGifts).pick({
  friendId: true,
  giftData: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertSavedGift = z.infer<typeof insertSavedGiftSchema>;
export type SavedGift = typeof savedGifts.$inferSelect;

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
