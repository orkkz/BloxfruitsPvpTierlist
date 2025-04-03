import { 
  players, Player, InsertPlayer, 
  tiers, Tier, InsertTier, 
  admins, Admin, InsertAdmin,
  PlayerWithTiers 
} from "@shared/schema";
import { z } from "zod";

// Storage interface for player data and tier management
export interface IStorage {
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
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Combined methods
  getPlayersWithTiers(category?: string): Promise<PlayerWithTiers[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private tiers: Map<number, Tier>;
  private admins: Map<number, Admin>;
  private playerIdCounter: number;
  private tierIdCounter: number;
  private adminIdCounter: number;

  constructor() {
    this.players = new Map();
    this.tiers = new Map();
    this.admins = new Map();
    this.playerIdCounter = 1;
    this.tierIdCounter = 1;
    this.adminIdCounter = 1;
    
    // Initialize with default admin
    this.createAdmin({
      username: "lucifer",
      password: "mephist" // In a real app, this would be hashed
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
      ...playerData,
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
      ...playerData
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
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const id = this.adminIdCounter++;
    const admin: Admin = {
      id,
      ...adminData
    };
    this.admins.set(id, admin);
    return admin;
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
    result.sort((a, b) => b.player.points - a.player.points);
    
    return result;
  }
}

// Export an instance of MemStorage
export const storage = new MemStorage();
