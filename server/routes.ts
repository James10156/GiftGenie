import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, insertSavedGiftSchema } from "@shared/schema";
import { generateGiftRecommendations } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "GiftGenie API"
    });
  });
  
  // Friends endpoints
  app.get("/api/friends", async (req, res) => {
    try {
      const friends = await storage.getAllFriends();
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/:id", async (req, res) => {
    try {
      const friend = await storage.getFriend(req.params.id);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend" });
    }
  });

  app.post("/api/friends", async (req, res) => {
    try {
      const result = insertFriendSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid friend data",
          errors: result.error.issues 
        });
      }

      const friend = await storage.createFriend(result.data);
      res.status(201).json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to create friend" });
    }
  });

  app.put("/api/friends/:id", async (req, res) => {
    try {
      const result = insertFriendSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid friend data",
          errors: result.error.issues 
        });
      }

      const friend = await storage.updateFriend(req.params.id, result.data);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to update friend" });
    }
  });

  app.delete("/api/friends/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFriend(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friend" });
    }
  });

  // Gift recommendations endpoint
  app.post("/api/gift-recommendations", async (req, res) => {
    try {
      const { friendId, budget } = req.body;
      
      if (!friendId || !budget) {
        return res.status(400).json({ 
          message: "Friend ID and budget are required" 
        });
      }

      const friend = await storage.getFriend(friendId);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }

      const recommendations = await generateGiftRecommendations(
        friend.personalityTraits,
        friend.interests,
        budget,
        friend.name,
        friend.currency || "USD",
        friend.country || "United States",
        friend.notes || undefined
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Gift recommendation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate gift recommendations" 
      });
    }
  });

  // Saved gifts endpoints
  app.get("/api/saved-gifts", async (req, res) => {
    try {
      const savedGifts = await storage.getAllSavedGifts();
      res.json(savedGifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved gifts" });
    }
  });

  app.get("/api/saved-gifts/friend/:friendId", async (req, res) => {
    try {
      const savedGifts = await storage.getSavedGiftsByFriend(req.params.friendId);
      res.json(savedGifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved gifts" });
    }
  });

  app.post("/api/saved-gifts", async (req, res) => {
    try {
      const result = insertSavedGiftSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid saved gift data",
          errors: result.error.issues 
        });
      }

      const savedGift = await storage.createSavedGift(result.data);
      res.status(201).json(savedGift);
    } catch (error) {
      res.status(500).json({ message: "Failed to save gift" });
    }
  });

  app.delete("/api/saved-gifts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSavedGift(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Saved gift not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saved gift" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
