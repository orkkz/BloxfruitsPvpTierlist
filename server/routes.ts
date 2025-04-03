import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, 
  insertTierSchema, 
  loginSchema,
  categoryEnum
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = express.Router();
  
  // Get players with their tiers (optionally filtered by category)
  apiRouter.get("/players", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      
      if (category && !categoryEnum.safeParse(category).success) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const players = await storage.getPlayersWithTiers(category);
      return res.json(players);
    } catch (error) {
      console.error("Error getting players:", error);
      return res.status(500).json({ message: "Failed to get players" });
    }
  });
  
  // Search players by username
  apiRouter.get("/players/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const players = await storage.searchPlayers(query);
      return res.json(players);
    } catch (error) {
      console.error("Error searching players:", error);
      return res.status(500).json({ message: "Failed to search players" });
    }
  });
  
  // Get player by ID with their tiers
  apiRouter.get("/players/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const player = await storage.getPlayerById(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const tiers = await storage.getTiersByPlayerId(id);
      return res.json({ player, tiers });
    } catch (error) {
      console.error("Error getting player:", error);
      return res.status(500).json({ message: "Failed to get player" });
    }
  });
  
  // Create or update player by Roblox ID
  apiRouter.post("/players", async (req: Request, res: Response) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      
      // Check if player already exists
      const existingPlayer = await storage.getPlayerByRobloxId(playerData.robloxId);
      
      if (existingPlayer) {
        // Update existing player
        const updatedPlayer = await storage.updatePlayer(existingPlayer.id, playerData);
        return res.json(updatedPlayer);
      } else {
        // Create new player
        const newPlayer = await storage.createPlayer(playerData);
        return res.status(201).json(newPlayer);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error creating/updating player:", error);
      return res.status(500).json({ message: "Failed to create/update player" });
    }
  });
  
  // Create or update a tier for a player
  apiRouter.post("/tiers", async (req: Request, res: Response) => {
    try {
      const tierData = insertTierSchema.parse(req.body);
      
      // Check if player exists
      const player = await storage.getPlayerById(tierData.playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Create or update tier
      const tier = await storage.createTier(tierData);
      return res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tier data", errors: error.errors });
      }
      console.error("Error creating/updating tier:", error);
      return res.status(500).json({ message: "Failed to create/update tier" });
    }
  });
  
  // Admin authentication
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminByUsername(credentials.username);
      
      if (!admin || admin.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would set a session or token here
      return res.json({ 
        success: true, 
        admin: { id: admin.id, username: admin.username }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      console.error("Error during login:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Register the API routes
  app.use("/api", apiRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
