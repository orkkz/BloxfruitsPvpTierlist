import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertPlayerSchema, 
  insertTierSchema, 
  loginSchema,
  categoryEnum,
  newAdminSchema,
  COMBAT_TITLE_MAPPING
} from "@shared/schema";
import { sendDiscordWebhook } from "./webhook-utils.js";
import { z } from "zod";
import { initDatabase, seedDefaultAdmin } from "./pg-db";

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
      // Check admin permissions
      const admin = req.user as any;
      if (!admin.canManagePlayers) {
        return res.status(403).json({ message: "You don't have permission to manage players" });
      }
      
      const playerData = insertPlayerSchema.parse(req.body);
      
      // Ensure combat titles are using new naming convention
      if (playerData.combatTitle && Object.keys(COMBAT_TITLE_MAPPING).includes(playerData.combatTitle)) {
        playerData.combatTitle = COMBAT_TITLE_MAPPING[playerData.combatTitle as keyof typeof COMBAT_TITLE_MAPPING];
      }
      
      // Check if player already exists
      const existingPlayer = await storage.getPlayerByRobloxId(playerData.robloxId);
      let player;
      
      if (existingPlayer) {
        // Update existing player
        player = await storage.updatePlayer(existingPlayer.id, playerData);
      } else {
        // Create new player
        player = await storage.createPlayer(playerData);
      }
      
      // If webhook URL is provided, send a notification
      // Note: For new players this might not have any tiers yet
      if (playerData.webhookUrl) {
        // Get any existing tiers for this player or an empty array
        const tiers = existingPlayer 
          ? await storage.getTiersByPlayerId(existingPlayer.id)
          : [];
        
        // Send webhook with player data
        await sendDiscordWebhook(playerData.webhookUrl, {
          username: player?.username || playerData.username,
          avatarUrl: player?.avatarUrl || playerData.avatarUrl,
          combatTitle: player?.combatTitle || playerData.combatTitle || "Pirate",
          tiers: tiers
        });
      }
      
      return existingPlayer ? res.json(player) : res.status(201).json(player);
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
      // Check admin permissions
      const admin = req.user as any;
      if (!admin.canManagePlayers) {
        return res.status(403).json({ message: "You don't have permission to manage player tiers" });
      }
      
      const tierData = insertTierSchema.parse(req.body);
      
      // Check if player exists
      const player = await storage.getPlayerById(tierData.playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Create or update tier
      const tier = await storage.createTier(tierData);
      
      // Send webhook notification if player has a webhook URL
      if (player.webhookUrl) {
        // Get all tiers for this player
        const tiers = await storage.getTiersByPlayerId(player.id);
        
        // Send webhook with player and tier data
        await sendDiscordWebhook(player.webhookUrl, {
          username: player.username,
          avatarUrl: player.avatarUrl,
          combatTitle: player.combatTitle || "Pirate", // Default to "Pirate" if no combat title
          tiers: tiers
        });
      }
      
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
      // Check admin permissions
      const admin = req.user as any;
      if (!admin.canManagePlayers) {
        return res.status(403).json({ message: "You don't have permission to manage players" });
      }
      
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
      // Check admin permissions
      const admin = req.user as any;
      if (!admin.canManagePlayers) {
        return res.status(403).json({ message: "You don't have permission to manage players" });
      }
      
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
      
      // Ensure combat titles are using new naming convention
      if (playerData.combatTitle && COMBAT_TITLE_MAPPING[playerData.combatTitle as keyof typeof COMBAT_TITLE_MAPPING]) {
        playerData.combatTitle = COMBAT_TITLE_MAPPING[playerData.combatTitle as keyof typeof COMBAT_TITLE_MAPPING];
      }
      
      // Update player
      const updatedPlayer = await storage.updatePlayer(id, playerData);
      
      // Send webhook notification if player has a webhook URL
      if (updatedPlayer?.webhookUrl) {
        // Get all tiers for this player
        const tiers = await storage.getTiersByPlayerId(id);
        
        // Send webhook with player and tier data
        await sendDiscordWebhook(updatedPlayer.webhookUrl, {
          username: updatedPlayer.username,
          avatarUrl: updatedPlayer.avatarUrl,
          combatTitle: updatedPlayer.combatTitle || "Pirate", // Default to "Pirate" if no combat title
          tiers: tiers
        });
      }
      
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
      // Check admin permissions
      const admin = req.user as any;
      if (!admin.canManagePlayers) {
        return res.status(403).json({ message: "You don't have permission to manage site settings" });
      }
      
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
  
  // Database management routes
  
  // Get database stats
  apiRouter.get("/database/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check admin permissions (must be super admin)
      const admin = req.user as any;
      if (!admin.isSuperAdmin) {
        return res.status(403).json({ message: "You don't have permission to access database information" });
      }
      
      // Get the database type
      const dbType = process.env.DATABASE_URL?.includes('mysql') ? 'MySQL' : 
                     process.env.DATABASE_URL?.includes('postgres') ? 'PostgreSQL' : 'In-Memory';
      
      // Get statistics from storage
      const players = await storage.getPlayers();
      const tiers = await storage.getTiers();
      const admins = await storage.getAdmins();
      
      // Check if we're connected to a real database
      const connected = dbType !== 'In-Memory';
      const status = connected ? 'Connected' : 'Using fallback in-memory storage';
      
      return res.json({
        success: true,
        stats: {
          type: dbType,
          playerCount: players.length,
          tierCount: tiers.length,
          adminCount: admins.length,
          connected,
          status
        }
      });
    } catch (error) {
      console.error("Error getting database stats:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get database stats",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Reset database (danger zone!)
  apiRouter.post("/database/reset", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check admin permissions (must be super admin)
      const admin = req.user as any;
      if (!admin.isSuperAdmin) {
        return res.status(403).json({ message: "You don't have permission to reset the database" });
      }
      
      // In a real production app, you would want additional safeguards here
      // and probably a more sophisticated approach to resetting the database
      
      // For this app, we'll simply clear the database and reinitialize
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          success: false,
          message: "Database reset is not allowed in production mode" 
        });
      }
      
      try {
        // Drop and recreate the tables
        await initDatabase();
        await seedDefaultAdmin();
        
        return res.json({
          success: true,
          message: "Database has been reset successfully"
        });
      } catch (dbError) {
        console.error("Error resetting database:", dbError);
        return res.status(500).json({ 
          success: false,
          message: "Failed to reset database", 
          error: dbError instanceof Error ? dbError.message : "Unknown database error"
        });
      }
    } catch (error) {
      console.error("Error in database reset route:", error);
      return res.status(500).json({ 
        success: false,
        message: "An unexpected error occurred", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get current admin user
  apiRouter.get("/user", isAuthenticated, async (req: Request, res: Response) => {
    return res.json(req.user);
  });
  
  // Create new admin (super admin only)
  apiRouter.post("/admins", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check admin permissions (must be super admin)
      const admin = req.user as any;
      if (!admin.isSuperAdmin) {
        return res.status(403).json({ message: "Only super admins can create new admin accounts" });
      }
      
      const newAdminData = newAdminSchema.parse(req.body);
      
      // Check if username already exists
      const existingAdmin = await storage.getAdminByUsername(newAdminData.username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create the new admin
      const newAdmin = await storage.createAdmin(newAdminData);
      
      // Remove the password from the response
      const { password, ...adminWithoutPassword } = newAdmin;
      
      return res.status(201).json(adminWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid admin data", errors: error.errors });
      }
      console.error("Error creating admin:", error);
      return res.status(500).json({ message: "Failed to create admin" });
    }
  });
  
  // Get all admins (super admin only)
  apiRouter.get("/admins", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check admin permissions (must be super admin)
      const admin = req.user as any;
      if (!admin.isSuperAdmin) {
        return res.status(403).json({ message: "Only super admins can view admin accounts" });
      }
      
      // Get all admins from storage
      const admins = await storage.getAdmins();
      
      // Remove passwords from response
      const adminsWithoutPasswords = admins.map(admin => {
        const { password, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });
      
      return res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error("Error fetching admins:", error);
      return res.status(500).json({ message: "Failed to fetch admins" });
    }
  });
  
  // Register the API routes
  app.use("/api", apiRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
