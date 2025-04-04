import { 
  players, Player, InsertPlayer, 
  tiers, Tier, InsertTier, 
  admins, Admin, InsertAdmin,
  PlayerWithTiers 
} from "../shared/schema";
import { db, pool, initDatabase, seedDefaultAdmin, testConnection } from "./mysql-db";
import { eq, and, like, desc } from "drizzle-orm";
import { z } from "zod";

// Import session-related types and implementations
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";

// Storage interface for player data and tier management
export interface IStorage {
  // Session store (needed for authentication)
  sessionStore: session.Store;
  
  // Player methods
  getPlayers(): Promise<Player[]>;
  getPlayerById(id: number): Promise<Player | undefined>;
  getPlayerByRobloxId(robloxId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  searchPlayers(query: string): Promise<Player[]>;
  
  // Tier methods
  getTiers(): Promise<Tier[]>;
  getTiersByPlayerId(playerId: number): Promise<Tier[]>;
  getTiersByCategory(category: string): Promise<Tier[]>;
  getTierByPlayerAndCategory(playerId: number, category: string): Promise<Tier | undefined>;
  createTier(tier: InsertTier): Promise<Tier>;
  updateTier(playerId: number, category: string, tier: Partial<InsertTier>): Promise<Tier | undefined>;
  deleteTier(id: number): Promise<boolean>;
  
  // Admin methods
  getAdminById(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmins(): Promise<Admin[]>;
  
  // Combined methods
  getPlayersWithTiers(category?: string): Promise<PlayerWithTiers[]>;
}

// MySQL storage implementation
export class MySQLStorage implements IStorage {
  private initialized: boolean = false;
  public sessionStore: session.Store;
  
  constructor() {
    // Create an in-memory session store for MySQL
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // We'll initialize asynchronously to avoid blocking
    this.initialize().catch(error => {
      console.error("Error initializing MySQL database:", error);
    });
  }

  private async initialize() {
    try {
      // Test the connection first
      const connected = await testConnection();
      if (!connected) {
        throw new Error("Unable to connect to PostgreSQL database");
      }
      
      await initDatabase();
      await seedDefaultAdmin();
      this.initialized = true;
      console.log("PostgreSQL database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error; // Re-throw to trigger fallback
    }
  }
  
  private async ensureInitialized() {
    if (!this.initialized) {
      // If not yet initialized, wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!this.initialized) {
        throw new Error("PostgreSQL database not initialized");
      }
    }
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    await this.ensureInitialized();
    const result = await db.select().from(players);
    return result;
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(players).where(eq(players.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getPlayerByRobloxId(robloxId: string): Promise<Player | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(players).where(eq(players.robloxId, robloxId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    await this.ensureInitialized();
    
    // Prepare player data with defaults
    const data = {
      robloxId: playerData.robloxId,
      username: playerData.username,
      avatarUrl: playerData.avatarUrl,
      combatTitle: playerData.combatTitle || "Rookie",
      points: playerData.points || 0,
      bounty: playerData.bounty || "0",
      region: playerData.region || "Global"
    };
    
    // Insert the player
    const result = await db.insert(players).values(data).returning();
    
    if (!result || result.length === 0) {
      throw new Error("Failed to create player");
    }
    
    return result[0];
  }

  async updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<Player | undefined> {
    await this.ensureInitialized();
    
    // Create an object with the fields to update
    const updateData: Record<string, any> = {};
    
    if (playerData.robloxId !== undefined) updateData.robloxId = playerData.robloxId;
    if (playerData.username !== undefined) updateData.username = playerData.username;
    if (playerData.avatarUrl !== undefined) updateData.avatarUrl = playerData.avatarUrl;
    if (playerData.combatTitle !== undefined) updateData.combatTitle = playerData.combatTitle;
    if (playerData.points !== undefined) updateData.points = playerData.points;
    if (playerData.region !== undefined) updateData.region = playerData.region;
    if (playerData.bounty !== undefined) updateData.bounty = playerData.bounty;
    
    if (Object.keys(updateData).length === 0) {
      return await this.getPlayerById(id); // Nothing to update
    }
    
    // Update the player
    await db.update(players)
      .set(updateData)
      .where(eq(players.id, id));
    
    // Fetch the updated player
    return await this.getPlayerById(id);
  }

  async deletePlayer(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      "DELETE FROM players WHERE id = ?",
      [id]
    );
    
    return (result as any).affectedRows > 0;
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM players WHERE username LIKE ?",
      [`%${query}%`]
    );
    return rows as Player[];
  }

  // Tier methods
  async getTiers(): Promise<Tier[]> {
    const [rows] = await pool.execute("SELECT * FROM tiers");
    return rows as Tier[];
  }

  async getTiersByPlayerId(playerId: number): Promise<Tier[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM tiers WHERE player_id = ?",
      [playerId]
    );
    return rows as Tier[];
  }

  async getTiersByCategory(category: string): Promise<Tier[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM tiers WHERE category = ?",
      [category]
    );
    return rows as Tier[];
  }

  async getTierByPlayerAndCategory(playerId: number, category: string): Promise<Tier | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM tiers WHERE player_id = ? AND category = ?",
      [playerId, category]
    );
    const result = rows as Tier[];
    return result.length > 0 ? result[0] : undefined;
  }

  async createTier(tierData: InsertTier): Promise<Tier> {
    // Check if tier exists for this player and category
    const existingTier = await this.getTierByPlayerAndCategory(
      tierData.playerId,
      tierData.category
    );

    if (existingTier) {
      // Update existing tier
      return await this.updateTier(
        tierData.playerId,
        tierData.category,
        { tier: tierData.tier }
      ) as Tier;
    }

    // Create new tier
    const [result] = await pool.execute(
      "INSERT INTO tiers (player_id, category, tier) VALUES (?, ?, ?)",
      [tierData.playerId, tierData.category, tierData.tier]
    );
    
    // Get the inserted ID
    const insertId = (result as any).insertId;
    
    // Fetch the created tier
    const [rows] = await pool.execute(
      "SELECT * FROM tiers WHERE id = ?",
      [insertId]
    );
    
    const tiers = rows as Tier[];
    if (tiers.length === 0) {
      throw new Error("Failed to retrieve created tier");
    }
    
    return tiers[0];
  }

  async updateTier(playerId: number, category: string, tierData: Partial<InsertTier>): Promise<Tier | undefined> {
    // Build SET clause
    const setFields: string[] = [];
    const values: any[] = [];
    
    if (tierData.tier !== undefined) {
      setFields.push("tier = ?");
      values.push(tierData.tier);
    }
    
    if (tierData.playerId !== undefined) {
      setFields.push("player_id = ?");
      values.push(tierData.playerId);
    }
    
    if (tierData.category !== undefined) {
      setFields.push("category = ?");
      values.push(tierData.category);
    }
    
    // Always update the updated_at field
    setFields.push("updated_at = NOW()");
    
    if (setFields.length === 0) {
      return await this.getTierByPlayerAndCategory(playerId, category);
    }
    
    // Add WHERE clause values
    values.push(playerId);
    values.push(category);
    
    await pool.execute(
      `UPDATE tiers SET ${setFields.join(", ")} WHERE player_id = ? AND category = ?`,
      values
    );
    
    return await this.getTierByPlayerAndCategory(playerId, category);
  }

  async deleteTier(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      "DELETE FROM tiers WHERE id = ?",
      [id]
    );
    
    return (result as any).affectedRows > 0;
  }

  // Admin methods
  async getAdminById(id: number): Promise<Admin | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE id = ?",
      [id]
    );
    
    const admins = rows as Admin[];
    return admins.length > 0 ? admins[0] : undefined;
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );
    
    const admins = rows as Admin[];
    return admins.length > 0 ? admins[0] : undefined;
  }

  async getAdmins(): Promise<Admin[]> {
    const [rows] = await pool.execute("SELECT * FROM admins");
    return rows as Admin[];
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const [result] = await pool.execute(
      "INSERT INTO admins (username, password, is_super_admin, can_manage_players, can_manage_admins) VALUES (?, ?, ?, ?, ?)",
      [
        adminData.username, 
        adminData.password,
        adminData.isSuperAdmin || 0,
        adminData.canManagePlayers || 1, // Default to can manage players
        adminData.canManageAdmins || 0
      ]
    );
    
    // Get the inserted ID
    const insertId = (result as any).insertId;
    
    // Fetch the created admin
    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE id = ?",
      [insertId]
    );
    
    const admins = rows as Admin[];
    if (admins.length === 0) {
      throw new Error("Failed to retrieve created admin");
    }
    
    return admins[0];
  }

  // Combined methods
  async getPlayersWithTiers(category?: string): Promise<PlayerWithTiers[]> {
    const allPlayers = await this.getPlayers();
    const result: PlayerWithTiers[] = [];

    for (const player of allPlayers) {
      let playerTiers = await this.getTiersByPlayerId(player.id);
      
      // Filter by category if provided
      if (category && category !== "overall") {
        playerTiers = playerTiers.filter(tier => tier.category === category);
      }

      // Only include players that have at least one tier in the requested category
      if (!category || playerTiers.length > 0) {
        result.push({
          player,
          tiers: playerTiers
        });
      }
    }

    // Sort by points (highest first)
    result.sort((a, b) => {
      const pointsA = a.player.points || 0;
      const pointsB = b.player.points || 0;
      return pointsB - pointsA;
    });
    
    return result;
  }
}

// In-memory storage implementation (kept for reference)
export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private tiers: Map<number, Tier>;
  private admins: Map<number, Admin>;
  private playerIdCounter: number;
  private tierIdCounter: number;
  private adminIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.players = new Map();
    this.tiers = new Map();
    this.admins = new Map();
    this.playerIdCounter = 1;
    this.tierIdCounter = 1;
    this.adminIdCounter = 1;
    
    // Create an in-memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default admin (using pre-hashed password for 'mephist')
    this.admins.set(this.adminIdCounter++, {
      id: 1,
      username: "lucifer",
      password: "45092e0c0e5822ae252b3b5e86fb6a4a57c9a639b951a2c6c0ac1db5da28647a6bfd8a6ebb75b38759ba53a3765c3d0f69845dfedd30dd073b27ffd3e5bb4265.7c9bf9c2aede0ef6b4395a40928f7c5b", // hashed version of 'mephist'
      isSuperAdmin: 1,  // Super admin privileges
      canManagePlayers: 1, // Can manage players
      canManageAdmins: 1  // Can manage other admins
    });
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByRobloxId(robloxId: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      (player) => player.robloxId === robloxId
    );
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const id = this.playerIdCounter++;
    const player: Player = {
      id,
      robloxId: playerData.robloxId,
      username: playerData.username,
      avatarUrl: playerData.avatarUrl,
      region: playerData.region || "Global",
      combatTitle: playerData.combatTitle || "Rookie",
      points: playerData.points || 0,
      bounty: playerData.bounty || "0",
      webhookUrl: playerData.webhookUrl || null,
      createdAt: new Date()
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer: Player = {
      ...player,
      robloxId: playerData.robloxId || player.robloxId,
      username: playerData.username || player.username,
      avatarUrl: playerData.avatarUrl || player.avatarUrl,
      combatTitle: playerData.combatTitle || player.combatTitle,
      points: playerData.points !== undefined ? playerData.points : player.points,
      region: playerData.region || player.region,
      bounty: playerData.bounty || player.bounty,
      webhookUrl: playerData.webhookUrl !== undefined ? playerData.webhookUrl : player.webhookUrl
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: number): Promise<boolean> {
    return this.players.delete(id);
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.players.values()).filter(
      (player) => player.username.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Tier methods
  async getTiers(): Promise<Tier[]> {
    return Array.from(this.tiers.values());
  }

  async getTiersByPlayerId(playerId: number): Promise<Tier[]> {
    return Array.from(this.tiers.values()).filter(
      (tier) => tier.playerId === playerId
    );
  }

  async getTiersByCategory(category: string): Promise<Tier[]> {
    return Array.from(this.tiers.values()).filter(
      (tier) => tier.category === category
    );
  }

  async getTierByPlayerAndCategory(playerId: number, category: string): Promise<Tier | undefined> {
    return Array.from(this.tiers.values()).find(
      (tier) => tier.playerId === playerId && tier.category === category
    );
  }

  async createTier(tierData: InsertTier): Promise<Tier> {
    const existingTier = await this.getTierByPlayerAndCategory(
      tierData.playerId,
      tierData.category
    );

    if (existingTier) {
      // Update existing tier
      const updatedTier = {
        ...existingTier,
        tier: tierData.tier,
        updatedAt: new Date()
      };
      this.tiers.set(existingTier.id, updatedTier);
      return updatedTier;
    }

    // Create new tier
    const id = this.tierIdCounter++;
    const tier: Tier = {
      id,
      ...tierData,
      updatedAt: new Date()
    };
    this.tiers.set(id, tier);
    return tier;
  }

  async updateTier(playerId: number, category: string, tierData: Partial<InsertTier>): Promise<Tier | undefined> {
    const existingTier = await this.getTierByPlayerAndCategory(playerId, category);
    if (!existingTier) return undefined;
    
    const updatedTier: Tier = {
      ...existingTier,
      ...tierData,
      updatedAt: new Date()
    };
    this.tiers.set(existingTier.id, updatedTier);
    return updatedTier;
  }

  async deleteTier(id: number): Promise<boolean> {
    return this.tiers.delete(id);
  }

  // Admin methods
  async getAdminById(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const id = this.adminIdCounter++;
    const admin: Admin = {
      id,
      ...adminData,
      isSuperAdmin: adminData.isSuperAdmin || 0,
      canManagePlayers: adminData.canManagePlayers || 1,
      canManageAdmins: adminData.canManageAdmins || 0
    };
    this.admins.set(id, admin);
    return admin;
  }
  
  async getAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  // Combined methods
  async getPlayersWithTiers(category?: string): Promise<PlayerWithTiers[]> {
    const allPlayers = await this.getPlayers();
    const result: PlayerWithTiers[] = [];

    for (const player of allPlayers) {
      let playerTiers = await this.getTiersByPlayerId(player.id);
      
      // Filter by category if provided
      if (category && category !== "overall") {
        playerTiers = playerTiers.filter(tier => tier.category === category);
      }

      // Only include players that have at least one tier in the requested category
      if (!category || playerTiers.length > 0) {
        result.push({
          player,
          tiers: playerTiers
        });
      }
    }

    // Sort by points (highest first)
    result.sort((a, b) => {
      const pointsA = a.player.points || 0;
      const pointsB = b.player.points || 0;
      return pointsB - pointsA;
    });
    
    return result;
  }
}

// Create an async function to initialize storage
export async function initializeStorage(): Promise<IStorage> {
  try {
    // Test the PostgreSQL connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error("PostgreSQL connection test failed");
    }
    
    // If connection is good, use PostgreSQL storage
    console.log("Using PostgreSQL storage");
    return new MySQLStorage();
  } catch (error) {
    console.warn("Failed to initialize PostgreSQL storage:", error);
    console.log("Falling back to in-memory storage");
    return new MemStorage();
  }
}

// Create storage with fallback
// Use a promise that will be resolved once storage is initialized
let storagePromise: Promise<IStorage>;
let storageInstance: IStorage;

// Initialize storage (will be resolved later)
storagePromise = initializeStorage().then(storage => {
  storageInstance = storage;
  return storage;
});

// Storage proxy that ensures storage is initialized before use
class StorageProxy implements IStorage {
  // SessionStore accessor via property
  get sessionStore(): session.Store {
    // If storage instance isn't initialized yet, create a temporary in-memory store
    if (!storageInstance) {
      const MemoryStore = createMemoryStore(session);
      return new MemoryStore({ checkPeriod: 86400000 });
    }
    return storageInstance.sessionStore;
  }
  
  constructor() {}
  
  // Helper to ensure storage is available
  private async getStorage(): Promise<IStorage> {
    if (!storageInstance) {
      await storagePromise;
    }
    return storageInstance;
  }

  // Forward all method calls to the actual storage instance
  async getPlayers(): Promise<Player[]> {
    const storage = await this.getStorage();
    return storage.getPlayers();
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    const storage = await this.getStorage();
    return storage.getPlayerById(id);
  }

  async getPlayerByRobloxId(robloxId: string): Promise<Player | undefined> {
    const storage = await this.getStorage();
    return storage.getPlayerByRobloxId(robloxId);
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const storage = await this.getStorage();
    return storage.createPlayer(player);
  }

  async updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined> {
    const storage = await this.getStorage();
    return storage.updatePlayer(id, player);
  }

  async deletePlayer(id: number): Promise<boolean> {
    const storage = await this.getStorage();
    return storage.deletePlayer(id);
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const storage = await this.getStorage();
    return storage.searchPlayers(query);
  }

  async getTiers(): Promise<Tier[]> {
    const storage = await this.getStorage();
    return storage.getTiers();
  }

  async getTiersByPlayerId(playerId: number): Promise<Tier[]> {
    const storage = await this.getStorage();
    return storage.getTiersByPlayerId(playerId);
  }

  async getTiersByCategory(category: string): Promise<Tier[]> {
    const storage = await this.getStorage();
    return storage.getTiersByCategory(category);
  }

  async getTierByPlayerAndCategory(playerId: number, category: string): Promise<Tier | undefined> {
    const storage = await this.getStorage();
    return storage.getTierByPlayerAndCategory(playerId, category);
  }

  async createTier(tier: InsertTier): Promise<Tier> {
    const storage = await this.getStorage();
    return storage.createTier(tier);
  }

  async updateTier(playerId: number, category: string, tier: Partial<InsertTier>): Promise<Tier | undefined> {
    const storage = await this.getStorage();
    return storage.updateTier(playerId, category, tier);
  }

  async deleteTier(id: number): Promise<boolean> {
    const storage = await this.getStorage();
    return storage.deleteTier(id);
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const storage = await this.getStorage();
    return storage.getAdminById(id);
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const storage = await this.getStorage();
    return storage.getAdminByUsername(username);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const storage = await this.getStorage();
    return storage.createAdmin(admin);
  }
  
  async getAdmins(): Promise<Admin[]> {
    const storage = await this.getStorage();
    return storage.getAdmins();
  }

  async getPlayersWithTiers(category?: string): Promise<PlayerWithTiers[]> {
    const storage = await this.getStorage();
    return storage.getPlayersWithTiers(category);
  }
}

// Export a proxy that will delegate to the correct storage implementation
export const storage = new StorageProxy();
