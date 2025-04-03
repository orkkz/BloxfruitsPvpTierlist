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
 * Add or update a player with tiers
 */
export async function addPlayerWithTier(data: NewPlayerData): Promise<{ player: Player, tier: Tier, additionalTiers?: Tier[] }> {
  try {
    // Player data to use for creating/updating
    let playerData: any = {
      robloxId: data.robloxId,
      combatTitle: data.combatTitle || "Combat Master",
      points: data.points || 300,
      region: data.region || "Global",
      bounty: data.bounty || "0"
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
    
    // Create or update the primary tier
    const tierRes = await apiRequest("POST", "/api/tiers", {
      playerId: player.id,
      category: data.category,
      tier: data.tier
    });
    
    if (!tierRes.ok) {
      throw new Error("Failed to create/update primary tier");
    }
    
    const tier = await tierRes.json();
    
    // If there are additional categories to add
    let additionalTiers: Tier[] = [];
    if (data.categories && data.categories.length > 0) {
      const tierPromises = data.categories.map(catTier => 
        apiRequest("POST", "/api/tiers", {
          playerId: player.id,
          category: catTier.category,
          tier: catTier.tier
        }).then(res => {
          if (!res.ok) {
            throw new Error(`Failed to create/update tier for ${catTier.category}`);
          }
          return res.json();
        })
      );
      
      additionalTiers = await Promise.all(tierPromises);
    }
    
    return { 
      player, 
      tier,
      additionalTiers: additionalTiers.length > 0 ? additionalTiers : undefined
    };
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

/**
 * Delete a player by ID
 */
export async function deletePlayer(id: number): Promise<{ success: boolean }> {
  const response = await apiRequest("DELETE", `/api/players/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to delete player: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update a player by ID
 */
export async function updatePlayer(id: number, data: Partial<Player>): Promise<Player> {
  const response = await apiRequest("PUT", `/api/players/${id}`, data);
  
  if (!response.ok) {
    throw new Error(`Failed to update player: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update site settings (logo URL)
 */
export async function updateSiteSettings(logoUrl: string): Promise<{ success: boolean, logoUrl: string }> {
  const response = await apiRequest("POST", "/api/settings", { logoUrl });
  
  if (!response.ok) {
    throw new Error(`Failed to update site settings: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // Update logo URL in localStorage for immediate effect
  if (result.success && result.logoUrl) {
    localStorage.setItem('logoUrl', result.logoUrl);
  }
  
  return result;
}
