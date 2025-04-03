import { apiRequest } from "./queryClient";
import { z } from "zod";
import { 
  Player, 
  PlayerWithTiers, 
  Tier, 
  LoginCredentials, 
  LoginResponse,
  NewPlayerData 
} from "./types";
import { getRobloxUserById } from "./roblox";

/**
 * Get all players with their tiers
 */
export async function getPlayers(category?: string): Promise<PlayerWithTiers[]> {
  const endpoint = category 
    ? `/api/players?category=${encodeURIComponent(category)}`
    : `/api/players`;
  
  const response = await fetch(endpoint, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Search players by username
 */
export async function searchPlayers(query: string): Promise<Player[]> {
  const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`, {
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error(`Failed to search players: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a player by ID with their tiers
 */
export async function getPlayerById(id: number): Promise<PlayerWithTiers> {
  const response = await fetch(`/api/players/${id}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch player: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Add or update a player with a tier
 */
export async function addPlayerWithTier(data: NewPlayerData): Promise<{ player: Player, tier: Tier }> {
  try {
    // Player data to use for creating/updating
    let playerData: any = {
      robloxId: data.robloxId,
      combatTitle: data.combatTitle || "Combat Master",
      points: data.points || 300,
      region: data.region || "Global"
    };

    // If using manual input, use the provided values
    if (data.useManualInput && data.manualUsername && data.manualAvatarUrl) {
      playerData.username = data.manualUsername;
      playerData.avatarUrl = data.manualAvatarUrl;
      // If display name provided, use it
      if (data.manualDisplayName) {
        playerData.displayName = data.manualDisplayName;
      }
    } else {
      // Otherwise fetch from Roblox API
      const robloxUser = await getRobloxUserById(data.robloxId);
      
      if (!robloxUser) {
        throw new Error("Failed to fetch Roblox user data");
      }
      
      playerData.username = robloxUser.username;
      playerData.avatarUrl = robloxUser.avatarUrl;
    }
    
    // Create or update player
    const playerRes = await apiRequest("POST", "/api/players", playerData);
    
    if (!playerRes.ok) {
      throw new Error("Failed to create/update player");
    }
    
    const player = await playerRes.json();
    
    // Create or update tier
    const tierRes = await apiRequest("POST", "/api/tiers", {
      playerId: player.id,
      category: data.category,
      tier: data.tier
    });
    
    if (!tierRes.ok) {
      throw new Error("Failed to create/update tier");
    }
    
    const tier = await tierRes.json();
    
    return { player, tier };
  } catch (error) {
    console.error("Error adding player with tier:", error);
    throw error;
  }
}

/**
 * Admin login
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  
  if (!response.ok) {
    throw new Error("Invalid credentials");
  }
  
  return await response.json();
}
