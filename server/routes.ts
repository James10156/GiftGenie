import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { storageAdapter } from "./storage-adapter";
import { insertFriendSchema, insertSavedGiftSchema, insertUserAnalyticsSchema, insertRecommendationFeedbackSchema, insertPerformanceMetricsSchema, insertBlogPostSchema } from "@shared/schema";
import { setupAuth, setupAuthRoutes, requireAuth, requireAdmin, type AuthenticatedRequest } from "./auth";
import { generateGiftRecommendations } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("[registerRoutes] Starting route registration...");
  // Setup authentication
  try {
    setupAuth(app);
    setupAuthRoutes(app);
    console.log("[registerRoutes] Auth setup complete.");
  } catch (err) {
    console.error("[registerRoutes] Error in auth setup:", err);
  }

  // Configure Cloudinary
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("[registerRoutes] Cloudinary config complete.");
  } catch (err) {
    console.error("[registerRoutes] Error in Cloudinary config:", err);
  }

  // Configure multer with Cloudinary storage
  let storage;
  let upload;
  try {
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'gift-genie/profile-pictures',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
      } as any,
    });
    console.log("[registerRoutes] Multer storage config complete.");
    upload = multer({ storage });
    console.log("[registerRoutes] Multer upload config complete.");
  } catch (err) {
    console.error("[registerRoutes] Error in Multer storage/upload config:", err);
  }

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

  // Get unique categories for suggestions (must come before /api/friends/:id)
  app.get("/api/friends/categories", async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await storageAdapter.getUniqueCategories(req.user?.id);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
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
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | null = null;
    let recommendations: any = null;
    
    try {
      const { friendId, budget: budgetStr } = req.body;
      
      if (!friendId || !budgetStr) {
        errorMessage = "Friend ID and budget are required";
        return res.status(400).json({ 
          message: errorMessage
        });
      }

      // Parse budget from string format (e.g., "£50" -> 50)
      const budget = parseFloat(budgetStr.replace(/[^\d\.]/g, '')) || 0;
      
      if (budget <= 0) {
        errorMessage = "Budget must be a positive number";
        return res.status(400).json({ 
          message: errorMessage
        });
      }

      const friend = await storageAdapter.getFriend(friendId, req.user?.id);
      if (!friend) {
        errorMessage = "Friend not found";
        return res.status(404).json({ message: errorMessage });
      }

      // Track AI recommendation performance
      const aiStartTime = Date.now();
      recommendations = await generateGiftRecommendations(
        friend.personalityTraits,
        friend.interests,
        budget,
        friend.name,
        friend.currency || "USD",
        friend.country || "United States",
        friend.notes || undefined
      );
      const aiResponseTime = Date.now() - aiStartTime;

      success = true;

      // Log AI recommendation performance
      await storageAdapter.logPerformanceMetric({
        userId: req.user?.id,
        operation: "ai_recommendation",
        responseTime: aiResponseTime,
        success: true,
        metadata: {
          friendId: String(friendId),
          budget: String(budget),
          currency: String(friend.currency || "USD"),
          country: String(friend.country || "United States"),
          recommendationsCount: String(Array.isArray(recommendations) ? recommendations.length : 0),
          personalityTraits: JSON.stringify(friend.personalityTraits ?? []),
          interests: JSON.stringify(friend.interests ?? [])
        } as any
      });

      res.json(recommendations);
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : "Failed to generate gift recommendations";
      console.error("Gift recommendation error:", error);
      
      // Log failed AI recommendation performance
      if (req.user?.id) {
        try {
          await storageAdapter.logPerformanceMetric({
            userId: req.user.id,
            operation: "ai_recommendation",
            responseTime: Date.now() - startTime,
            success: false,
            errorMessage,
            metadata: {
              friendId: String(req.body.friendId),
              budget: String(req.body.budget),
              error: String(errorMessage)
            } as any
          });
        } catch (logError) {
          console.error("Failed to log performance metric:", logError);
        }
      }
      
      res.status(500).json({ 
        message: errorMessage
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

  // Analytics endpoints
  app.post("/api/analytics/events", async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertUserAnalyticsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid analytics data",
          errors: result.error.issues 
        });
      }

      const analytics = await storageAdapter.createUserAnalytics(result.data, req.user?.id);
      res.status(201).json(analytics);
    } catch (error) {
      console.error("Failed to create analytics event:", error);
      res.status(500).json({ message: "Failed to record analytics event" });
    }
  });

  app.get("/api/analytics/events", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      let analytics;
      if (req.user?.isAdmin) {
        analytics = await storageAdapter.getAllUserAnalytics(limit); // FIX: get all analytics for admin
      } else {
        analytics = await storageAdapter.getUserAnalytics(req.user!.id, limit);
      }
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/analytics/feedback", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      let feedback;
      if (req.user?.isAdmin) {
        feedback = await storageAdapter.getRecommendationFeedback("all", limit);
      } else {
        feedback = await storageAdapter.getRecommendationFeedback(req.user!.id, limit);
      }
      feedback = Array.isArray(feedback) ? feedback.filter(f => f && typeof f === 'object') : [];
      res.json(feedback);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback data" });
    }
  });

  app.get("/api/analytics/performance", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const operation = req.query.operation as string;
      const limit = parseInt(req.query.limit as string) || 100;
      let metrics;
      if (req.user?.isAdmin) {
        metrics = await storageAdapter.getPerformanceMetrics(operation, limit); // all users
      } else {
        metrics = await storageAdapter.getPerformanceMetrics(operation, limit); // fallback, could filter by user if needed
      }
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Blog posts endpoints
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const posts = await storageAdapter.getAllBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const post = await storageAdapter.getBlogPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog-posts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertBlogPostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid blog post data",
          errors: result.error.issues 
        });
      }

      const post = await storageAdapter.createBlogPost({ ...result.data, authorId: req.user?.id });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/blog-posts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertBlogPostSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid blog post data",
          errors: result.error.issues 
        });
      }

      const post = await storageAdapter.updateBlogPost(req.params.id, result.data);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/blog-posts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storageAdapter.deleteBlogPost(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  return createServer(app);
}
