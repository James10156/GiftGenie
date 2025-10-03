import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { storageAdapter } from "./storage-adapter";
import { insertFriendSchema, insertSavedGiftSchema, insertUserAnalyticsSchema, insertRecommendationFeedbackSchema, insertPerformanceMetricsSchema, insertBlogPostSchema, insertGiftReminderSchema } from "@shared/schema";
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
  let profileStorage;
  let blogStorage;
  let profileUpload;
  let blogUpload;
  try {
    // Profile picture storage config
    profileStorage = new CloudinaryStorage({
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

    // Blog image storage config
    blogStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'gift-genie/blog-images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
      } as any,
    });

    console.log("[registerRoutes] Multer storage configs complete.");
    profileUpload = multer({ storage: profileStorage });
    blogUpload = multer({ storage: blogStorage });
    console.log("[registerRoutes] Multer upload configs complete.");
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

  // Profile picture upload endpoint
  app.post("/api/upload/profile-picture", (req, res) => {
    if (!profileUpload) {
      return res.status(500).json({ message: "Upload service not configured" });
    }
    profileUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ message: "Failed to upload profile picture" });
      }
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Return the Cloudinary URL in the format the frontend expects
        res.json({ 
          imageUrl: req.file.path,
          message: "Profile picture uploaded successfully" 
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload profile picture" });
      }
    });
  });

  // Blog image upload endpoint
  app.post("/api/blog/upload-image", requireAuth, requireAdmin, (req, res) => {
    if (!blogUpload) {
      return res.status(500).json({ message: "Upload service not configured" });
    }
    blogUpload.single('image')(req, res, (err) => {
      if (err) {
        console.error("Blog image upload error:", err);
        return res.status(500).json({ message: "Failed to upload blog image" });
      }
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Return the Cloudinary URL in the format the frontend expects
        res.json({ 
          imageUrl: req.file.path,
          message: "Blog image uploaded successfully" 
        });
      } catch (error) {
        console.error("Blog image upload error:", error);
        res.status(500).json({ message: "Failed to upload blog image" });
      }
    });
  });

  // Debug endpoint to inspect current user context (used in tests/diagnostics)
  app.get("/api/debug/user", (req: AuthenticatedRequest, res) => {
    res.json({
      user: req.user ?? null,
      timestamp: new Date().toISOString(),
    });
  });
  
  // Friends endpoints
  app.get("/api/friends", async (req: AuthenticatedRequest, res) => {
    try {
      // Prevent caching of friends data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
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

  // Get random demo friend from admin account
  app.get("/api/friends/demo/random", async (req: AuthenticatedRequest, res) => {
    try {
      const ADMIN_USER_ID = "bd7e40b3-e207-439e-9575-f25774dbf6d5";
      const adminFriends = await storageAdapter.getAllFriends(ADMIN_USER_ID);
      
      // Filter for demo characters by name
      const demoNames = ["Sherlock Holmes", "Snow White", "Tarzan", "Robin Hood", "Sleeping Beauty", "Peter Pan"];
      const demoFriends = adminFriends.filter(friend => 
        demoNames.includes(friend.name)
      );
      
      if (demoFriends.length === 0) {
        return res.status(404).json({ message: "No demo friends found" });
      }
      
      // Get the count parameter (default to 1 for backward compatibility)
      const count = parseInt(req.query.count as string) || 1;
      const maxCount = Math.min(count, demoFriends.length);
      
      // Shuffle and select random demo friends
      const shuffled = [...demoFriends].sort(() => Math.random() - 0.5);
      const selectedFriends = shuffled.slice(0, maxCount);
      
      // Return single friend or array based on count
      if (count === 1) {
        res.json(selectedFriends[0]);
      } else {
        res.json(selectedFriends);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch demo friend" });
    }
  });

  // Get multiple random demo friends from admin account
  app.get("/api/friends/demo/random/:count", async (req: AuthenticatedRequest, res) => {
    try {
      const count = parseInt(req.params.count) || 3;
      const maxCount = Math.min(count, 6); // Limit to max 6 (all available demo friends)
      
      const ADMIN_USER_ID = "bd7e40b3-e207-439e-9575-f25774dbf6d5";
      const adminFriends = await storageAdapter.getAllFriends(ADMIN_USER_ID);
      
      // Filter for demo characters by name
      const demoNames = ["Sherlock Holmes", "Snow White", "Tarzan", "Robin Hood", "Sleeping Beauty", "Peter Pan"];
      const demoFriends = adminFriends.filter(friend => 
        demoNames.includes(friend.name)
      );
      
      if (demoFriends.length === 0) {
        return res.status(404).json({ message: "No demo friends found" });
      }
      
      // Shuffle and return the requested number of demo friends
      const shuffled = [...demoFriends].sort(() => 0.5 - Math.random());
      const selectedFriends = shuffled.slice(0, maxCount);
      
      res.json(selectedFriends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch demo friends" });
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

      const friendData = result.data;
      const nameValid = typeof friendData.name === "string" && friendData.name.trim().length > 0;
      const normalizedTraits = Array.isArray(friendData.personalityTraits)
        ? friendData.personalityTraits
            .map((trait) => (typeof trait === "string" ? trait.trim() : ""))
            .filter(Boolean)
        : [];
      const normalizedInterests = Array.isArray(friendData.interests)
        ? friendData.interests
            .map((interest) => (typeof interest === "string" ? interest.trim() : ""))
            .filter(Boolean)
        : [];

      const traitsValid = normalizedTraits.length > 0;
      const interestsValid = normalizedInterests.length > 0;
      const currencyProvided = typeof friendData.currency === "string" ? friendData.currency.trim() : undefined;
      const countryProvided = typeof friendData.country === "string" ? friendData.country.trim() : undefined;

      if (!nameValid || !traitsValid || !interestsValid) {
        return res.status(400).json({
          message: "Invalid friend data",
          errors: [
            ...(!nameValid ? [{ path: ["name"], message: "Name is required" }] : []),
            ...(!traitsValid ? [{ path: ["personalityTraits"], message: "At least one personality trait is required" }] : []),
            ...(!interestsValid ? [{ path: ["interests"], message: "At least one interest is required" }] : []),
          ]
        });
      }

      const friend = await storageAdapter.createFriend({
        ...friendData,
        name: friendData.name.trim(),
        personalityTraits: normalizedTraits,
        interests: normalizedInterests,
        currency: currencyProvided && currencyProvided.length > 0 ? currencyProvided : "USD",
        country: countryProvided && countryProvided.length > 0 ? countryProvided : "United States",
      }, req.user?.id);
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

  // Update friend theme
  app.patch("/api/friends/:id/theme", async (req: AuthenticatedRequest, res) => {
    try {
      const { theme } = req.body;
      
      if (!theme || typeof theme !== 'string') {
        return res.status(400).json({ message: "Theme is required and must be a string" });
      }

      const friend = await storageAdapter.updateFriend(req.params.id, { theme }, req.user?.id);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to update friend theme" });
    }
  });

  // Gift Reminders endpoints
  app.get("/api/reminders", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const reminders = await storageAdapter.getUserGiftReminders(req.user.id);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get("/api/reminders/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const reminder = await storageAdapter.getGiftReminder(req.params.id, req.user?.id);
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminder" });
    }
  });

  app.get("/api/friends/:friendId/reminders", async (req: AuthenticatedRequest, res) => {
    try {
      const reminders = await storageAdapter.getFriendGiftReminders(req.params.friendId, req.user?.id);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend reminders" });
    }
  });

  app.post("/api/reminders", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Calculate reminder date based on occasion date and advance days
      const { occasionDate, advanceDays, ...reminderData } = req.body;
      const reminderDate = new Date(occasionDate);
      reminderDate.setDate(reminderDate.getDate() - (advanceDays || 7));

      const newReminder = {
        ...reminderData,
        userId: req.user.id,
        occasionDate,
        advanceDays: advanceDays || 7,
        reminderDate: reminderDate.toISOString(),
        status: 'active'
      };

      const reminder = await storageAdapter.createGiftReminder(newReminder, req.user.id);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { occasionDate, advanceDays, ...reminderData } = req.body;
      let updateData = reminderData;

      // Recalculate reminder date if occasion date or advance days changed
      if (occasionDate || advanceDays !== undefined) {
        const currentReminder = await storageAdapter.getGiftReminder(req.params.id, req.user?.id);
        if (!currentReminder) {
          return res.status(404).json({ message: "Reminder not found" });
        }

        const newOccasionDate = occasionDate || currentReminder.occasionDate;
        const newAdvanceDays = advanceDays !== undefined ? advanceDays : currentReminder.advanceDays;
        
        const reminderDate = new Date(newOccasionDate);
        reminderDate.setDate(reminderDate.getDate() - newAdvanceDays);

        updateData = {
          ...updateData,
          occasionDate: newOccasionDate,
          advanceDays: newAdvanceDays,
          reminderDate: reminderDate.toISOString()
        };
      }

      const reminder = await storageAdapter.updateGiftReminder(req.params.id, updateData, req.user?.id);
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storageAdapter.deleteGiftReminder(req.params.id, req.user?.id);
      if (!deleted) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // User notification preferences
  app.put("/api/user/notification-preferences", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storageAdapter.updateUserNotificationPreferences(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Test reminder endpoint (admin only)
  app.post("/api/reminders/:id/test", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { reminderService } = await import("./services/reminder");
      const success = await reminderService.testReminder(req.params.id);
      
      if (success) {
        res.json({ message: "Test reminder sent successfully" });
      } else {
        res.status(404).json({ message: "Reminder not found or failed to send" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to test reminder" });
    }
  });

  // Check due reminders endpoint (admin only)
  app.post("/api/reminders/check-due", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { reminderService } = await import("./services/reminder");
      await reminderService.checkDueReminders();
      res.json({ message: "Due reminders checked and processed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to check due reminders" });
    }
  });

  // Gift recommendations endpoint
  app.post("/api/gift-recommendations", async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | null = null;
    let recommendations: any = null;
    
    try {
      const { friendId, budget } = req.body;

      if (!friendId || budget === undefined || budget === null) {
        errorMessage = "Friend ID and budget are required";
        return res.status(400).json({ 
          message: errorMessage
        });
      }

      // Parse budget from string or number format (e.g., "£50" -> 50)
      const numericBudget = typeof budget === 'number'
        ? budget
        : parseFloat(String(budget).replace(/[^\d\.]/g, ''));

      if (!numericBudget || Number.isNaN(numericBudget) || numericBudget <= 0) {
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
        numericBudget,
        friend.name,
        friend.currency || "USD",
        friend.country || "United States",
        friend.notes || undefined,
        friend.gender || undefined,
        friend.ageRange || undefined
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
          budget: String(numericBudget),
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

      const savedGiftData = result.data;
      const friendIdValid = typeof savedGiftData.friendId === "string" && savedGiftData.friendId.trim().length > 0;
      const giftDataValid = savedGiftData.giftData && typeof savedGiftData.giftData === "object";
      const shops = giftDataValid && Array.isArray((savedGiftData.giftData as any).shops) ? (savedGiftData.giftData as any).shops : [];
      const requiredFieldsValid = giftDataValid &&
        ["name", "description", "price", "matchPercentage", "image"].every((field) => {
          const value = (savedGiftData.giftData as any)[field];
          if (field === "matchPercentage") {
            return typeof value === "number" && value >= 0;
          }
          return typeof value === "string" && value.trim().length > 0;
        });
      const shopsValid = shops.length > 0 && shops.every((shop: any) => (
        shop &&
        typeof shop.name === "string" && shop.name.trim().length > 0 &&
        typeof shop.url === "string" && shop.url.trim().length > 0 &&
        typeof shop.price === "string" && shop.price.trim().length > 0 &&
        typeof shop.inStock === "boolean"
      ));

      if (!friendIdValid || !giftDataValid || !requiredFieldsValid || !shopsValid) {
        return res.status(400).json({
          message: "Invalid saved gift data",
          errors: [
            ...(!friendIdValid ? [{ path: ["friendId"], message: "friendId is required" }] : []),
            ...(!giftDataValid ? [{ path: ["giftData"], message: "giftData must be provided" }] : []),
            ...(!requiredFieldsValid ? [{ path: ["giftData"], message: "giftData is missing required fields" }] : []),
            ...(!shopsValid ? [{ path: ["giftData", "shops"], message: "At least one valid shop is required" }] : []),
          ]
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
      console.log("[analytics-events] Incoming payload:", JSON.stringify(req.body, null, 2)); // Debug log
      const result = insertUserAnalyticsSchema.safeParse(req.body);
      if (!result.success) {
        console.error("[analytics-events] Validation failed:", result.error.issues); // Debug log
        return res.status(400).json({ 
          message: "Invalid analytics data",
          errors: result.error.issues 
        });
      }
      // Determine userId for analytics event
      const userId = req.user?.id || req.body.userId || req.body.sessionId;
      if (userId) {
        let userExists = await storageAdapter.getUser(userId);
        if (!userExists) {
          // Create minimal guest user record
          await storageAdapter.createUser({
            id: userId,
            username: userId,
            password: "", // No password for guest
            isAdmin: false
          });
        }
      }
      // Always pass userId to analytics creation
      const analytics = await storageAdapter.createUserAnalytics(result.data, userId);
      console.log("[analytics-events] Inserted analytics:", JSON.stringify(analytics, null, 2)); // Debug log
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
      console.log("[analytics-events] Fetched analytics:", JSON.stringify(analytics, null, 2)); // Debug log
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      if (error && error.stack) console.error(error.stack); // Print stack trace for debugging
      res.status(500).json({ message: "Failed to fetch analytics data", error: error?.message || error });
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
      console.log("Blog post creation request:", req.body);
      console.log("User:", req.user);
      
      const result = insertBlogPostSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Schema validation failed:", result.error.issues);
        return res.status(400).json({ 
          message: "Invalid blog post data",
          errors: result.error.issues 
        });
      }

      const postData = { ...result.data, authorId: req.user?.id };
      console.log("Creating blog post with data:", postData);
      
      const post = await storageAdapter.createBlogPost(postData);
      console.log("Blog post created successfully:", post);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
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

  app.post("/api/analytics/feedback", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const feedback = await storageAdapter.createRecommendationFeedback(req.body, req.user?.id);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Failed to create feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  return createServer(app);
}
