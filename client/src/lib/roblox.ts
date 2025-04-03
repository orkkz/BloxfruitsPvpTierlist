import { RobloxUser } from "./types";

/**
 * Gets a Roblox user by their ID using the Roblox API
 */
export async function getRobloxUserById(userId: string): Promise<RobloxUser | null> {
  try {
    // First get the username
    const userResponse = await fetch(`https://api.roblox.com/users/${userId}`);
    
    if (!userResponse.ok) {
      console.error(`Failed to fetch Roblox user ${userId}:`, userResponse.statusText);
      return null;
    }
    
    const userData = await userResponse.json();
    const username = userData.Username || "Unknown Player";
    
    // Then get the headshot using the correct API
    const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
    
    if (!headshotResponse.ok) {
      console.error(`Failed to fetch Roblox headshot for ${userId}:`, headshotResponse.statusText);
      return {
        id: parseInt(userId),
        username: username,
        avatarUrl: `https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=420&height=420&format=png`
      };
    }
    
    const headshotData = await headshotResponse.json();
    let avatarUrl = `https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;
    
    // Extract the image URL from the response
    if (headshotData && 
        headshotData.data && 
        headshotData.data.length > 0 && 
        headshotData.data[0].imageUrl) {
      avatarUrl = headshotData.data[0].imageUrl;
    }
    
    return {
      id: parseInt(userId),
      username: username,
      avatarUrl: avatarUrl
    };
  } catch (error) {
    console.error("Error fetching Roblox user:", error);
    
    // Return a fallback user in case of error
    return {
      id: parseInt(userId),
      username: "Unknown Player",
      avatarUrl: "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png"
    };
  }
}

/**
 * Gets a Roblox avatar URL by user ID using the headshot API
 */
export function getRobloxAvatarUrl(userId: string, size: number = 420): string {
  return `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=${size}x${size}&format=Png&isCircular=false`;
}
