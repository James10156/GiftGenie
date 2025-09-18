import type { Express } from "express";
import { createServer, type Server } from "http";
import { storageAdapter } from "./storage-adapter";
import { insertFriendSchema, insertSavedGiftSchema } from "@shared/schema";
import { generateGiftRecommendations } from "./services/openai";
import { setupAuth, setupAuthRoutes, requireAuth, type AuthenticatedRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication
  setupAuth(app);
  setupAuthRoutes(app);
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "GiftGenie API"
    });
  });
  
  // Friends endpoints
  app.get("/api/friends", async (req: AuthenticatedRequest, res) => {
    try {
      const friends = await storageAdapter.getAllFriends(req.user?.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const friend = await storageAdapter.getFriend(req.params.id, req.user?.id);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend" });
    }
  });

  app.post("/api/friends", async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertFriendSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid friend data",
          errors: result.error.issues 
        });
      }

      const friend = await storageAdapter.createFriend(result.data, req.user?.id);
      res.status(201).json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to create friend" });
    }
  });

  app.put("/api/friends/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertFriendSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid friend data",
          errors: result.error.issues 
        });
      }

      const friend = await storageAdapter.updateFriend(req.params.id, result.data, req.user?.id);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to update friend" });
    }
  });

  app.delete("/api/friends/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storageAdapter.deleteFriend(req.params.id, req.user?.id);
      if (!deleted) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friend" });
    }
  });

  // Gift recommendations endpoint
  app.post("/api/gift-recommendations", async (req: AuthenticatedRequest, res) => {
    try {
      const { friendId, budget: budgetStr } = req.body;
      
      if (!friendId || !budgetStr) {
        return res.status(400).json({ 
          message: "Friend ID and budget are required" 
        });
      }

      // Parse budget from string format (e.g., "£50" -> 50)
      const budget = parseFloat(budgetStr.replace(/[^\d\.]/g, '')) || 0;
      
      if (budget <= 0) {
        return res.status(400).json({ 
          message: "Budget must be a positive number" 
        });
      }

      const friend = await storageAdapter.getFriend(friendId, req.user?.id);
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
  app.get("/api/saved-gifts", async (req: AuthenticatedRequest, res) => {
    try {
      const savedGifts = await storageAdapter.getAllSavedGifts(req.user?.id);
      res.json(savedGifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved gifts" });
    }
  });

  app.get("/api/saved-gifts/friend/:friendId", async (req: AuthenticatedRequest, res) => {
    try {
      const savedGifts = await storageAdapter.getSavedGiftsByFriend(req.params.friendId, req.user?.id);
      res.json(savedGifts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved gifts" });
    }
  });

  app.post("/api/saved-gifts", async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertSavedGiftSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid saved gift data",
          errors: result.error.issues 
        });
      }

      const savedGift = await storageAdapter.createSavedGift(result.data, req.user?.id);
      res.status(201).json(savedGift);
    } catch (error) {
      res.status(500).json({ message: "Failed to save gift" });
    }
  });

  app.delete("/api/saved-gifts/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storageAdapter.deleteSavedGift(req.params.id, req.user?.id);
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
