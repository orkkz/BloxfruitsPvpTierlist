import { RobloxUser } from "./types";

/**
 * Gets a Roblox user by their ID using the Roblox API
 */
export async function getRobloxUserById(userId: string): Promise<RobloxUser | null> {
  try {
    // Use a proxy service or directly call the Roblox API
    const response = await fetch(`https://api.roblox.com/users/${userId}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch Roblox user ${userId}:`, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // In a real implementation, you would handle the actual Roblox API response format
    return {
      id: parseInt(userId),
      username: data.Username || "Unknown Player",
      avatarUrl: `https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=150&height=150&format=png`
    };
  } catch (error) {
    console.error("Error fetching Roblox user:", error);
    
    // Return a fallback user in case of error
    return {
      id: parseInt(userId),
      username: "Unknown Player",
      avatarUrl: "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/150/150/Image/Png"
    };
  }
}

/**
 * Gets a Roblox avatar URL by user ID
 */
export function getRobloxAvatarUrl(userId: string, size: number = 150): string {
  return `https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=${size}&height=${size}&format=png`;
}
