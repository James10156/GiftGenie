import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storageAdapter } from "./storage-adapter";
import { registerUserSchema } from "@shared/schema";

const PgSession = connectPgSimple(session);

// Extend Express Request to include user session
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
    isAdmin?: boolean;
    guestId?: string; // For anonymous guest sessions
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    isAdmin?: boolean;
  };
}

export function setupAuth(app: Express) {
  // Session middleware with PostgreSQL store for production
  const sessionStore = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
    ? new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session', // Use lowercase for PostgreSQL
        createTableIfMissing: true,
      })
    : undefined; // Use MemoryStore for development

  console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV);
  console.log('DEBUG: Using session store:', sessionStore ? 'PostgreSQL' : 'MemoryStore');

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'gift-genie-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  }));

  // Authentication middleware
  app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      // Authenticated user
      req.user = {
        id: req.session.userId,
        username: req.session.username!,
        isAdmin: req.session.isAdmin || false
      };
    } else {
      // Guest user - generate unique session ID if not exists
      if (!req.session.guestId) {
        req.session.guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }
      // Set guest user info
      req.user = {
        id: req.session.guestId,
        username: 'Guest',
        isAdmin: false
      };
    }
    next();
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function setupAuthRoutes(app: Express) {
  // Register endpoint
  app.post("/api/auth/register", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = registerUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid user data",
          errors: result.error.issues 
        });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const existingUser = await storageAdapter.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storageAdapter.createUser({
        username,
        password: hashedPassword,
        isAdmin: false
      });

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;

      res.status(201).json({ 
        id: user.id, 
        username: user.username,
        isAdmin: user.isAdmin || false
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Please enter both username and password" });
      }

      // Find user
      const user = await storageAdapter.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Account not found. Please check your username or create a new account." });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;

      console.log('DEBUG: Login successful, setting session for user:', user.id);
      console.log('DEBUG: Session after login:', req.session);

      res.json({ 
        id: user.id, 
        username: user.username,
        isAdmin: user.isAdmin || false
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: AuthenticatedRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Current user endpoint
  app.get("/api/auth/me", (req: AuthenticatedRequest, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Promote user to admin (for demo - in production this would require existing admin authorization)
  app.post("/api/auth/promote-admin", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const updatedUser = await storageAdapter.updateUserAdminStatus(userId, true);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User promoted to admin successfully",
        user: { id: updatedUser.id, username: updatedUser.username, isAdmin: updatedUser.isAdmin }
      });
    } catch (error) {
      console.error("Admin promotion error:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });
}