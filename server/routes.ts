import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertPlayerSchema, 
  insertTierSchema, 
  loginSchema,
  categoryEnum
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
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
  
  // Create or update player by Roblox ID (admin only)
  apiRouter.post("/players", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // Create or update a tier for a player (admin only)
  apiRouter.post("/tiers", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // Replace with authentication from auth.ts
  // This will be handled by passport
  
  // Delete a player by ID (admin only)
  apiRouter.delete("/players/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if player exists
      const player = await storage.getPlayerById(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Delete player's tiers first
      const tiers = await storage.getTiersByPlayerId(id);
      for (const tier of tiers) {
        await storage.deleteTier(tier.id);
      }
      
      // Delete player
      const deleted = await storage.deletePlayer(id);
      return res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting player:", error);
      return res.status(500).json({ message: "Failed to delete player" });
    }
  });
  
  // Update a player by ID (admin only)
  apiRouter.put("/players/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if player exists
      const player = await storage.getPlayerById(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Validate update data
      const playerData = insertPlayerSchema.partial().parse(req.body);
      
      // Update player
      const updatedPlayer = await storage.updatePlayer(id, playerData);
      return res.json(updatedPlayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error updating player:", error);
      return res.status(500).json({ message: "Failed to update player" });
    }
  });
  
  // Update site settings (logo URL) (admin only)
  apiRouter.post("/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { logoUrl } = req.body;
      
      if (typeof logoUrl !== 'string') {
        return res.status(400).json({ message: "Invalid logo URL" });
      }
      
      // In a real app, you would store this in a database
      // For simplicity, we'll just send it back as a successful response
      return res.json({ success: true, logoUrl });
    } catch (error) {
      console.error("Error updating settings:", error);
      return res.status(500).json({ message: "Failed to update settings" });
    }
  });
  
  // Register the API routes
  app.use("/api", apiRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
