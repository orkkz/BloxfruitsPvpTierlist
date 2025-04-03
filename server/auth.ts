import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { Admin } from "@shared/schema";
import { hashPassword, comparePasswords } from "./password-utils";

// Re-export for use in other modules
export { hashPassword, comparePasswords };

declare global {
  namespace Express {
    interface User extends Admin {}
  }
}

// Setup authentication for the app
export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "bloxfruits-tierlist-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: storage.sessionStore
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const admin = await storage.getAdminByUsername(username);
        
        if (!admin || !(await comparePasswords(password, admin.password))) {
          return done(null, false);
        }
        
        return done(null, admin);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Get the admin by ID directly
      const admin = await storage.getAdminById(id);
      if (!admin) {
        return done(null, false);
      }
      done(null, admin);
    } catch (error) {
      done(error, null);
    }
  });

  // Register authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingAdmin = await storage.getAdminByUsername(req.body.username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const admin = await storage.createAdmin({
        ...req.body,
        password: await hashPassword(req.body.password)
      });

      // Log the user in
      req.login(admin, (err) => {
        if (err) return next(err);
        res.status(201).json(admin);
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Middleware to check if user is authenticated
  app.use("/api/admin", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  });
}

// Middleware to check if the user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}