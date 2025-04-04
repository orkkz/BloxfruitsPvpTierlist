import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TierGrade, TierColors, Tier, PlayerWithTiers } from "./types";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tier colors for different tier grades
 * Updated to match the new design in the reference image
 */
export const tierColors: TierColors = {
  "SS": "bg-[#1a0505] border-red-800 text-red-500", // Dark red with red border
  "S": "bg-[#1e1100] border-orange-800 text-orange-500", // Dark orange
  "A": "bg-[#1e1400] border-amber-600 text-amber-500", // Dark amber
  "B": "bg-[#1e1804] border-yellow-600 text-yellow-400", // Dark yellow
  "C": "bg-[#051705] border-green-800 text-green-500", // Dark green
  "D": "bg-[#051a2e] border-blue-800 text-blue-500", // Dark blue
  "E": "bg-[#0a051a] border-indigo-800 text-indigo-500", // Dark indigo
};

/**
 * Region colors for different regions
 */
export const regionColors: Record<string, string> = {
  "NA": "bg-red-600 text-white",
  "EU": "bg-emerald-500 text-white",
  "ASIA": "bg-blue-500 text-white",
  "OCE": "bg-purple-500 text-white",
  "BR": "bg-yellow-500 text-black",
};

/**
 * Formats a player's combat title and points
 */
export function formatCombatTitle(title: string, points: number): string {
  return `${title} (${points} points)`;
}

/**
 * Gets the appropriate medal color class based on rank
 */
export function getMedalColor(rank: number): string {
  if (rank === 1) return "text-amber-500"; // Gold
  if (rank === 2) return "text-gray-400"; // Silver
  if (rank === 3) return "text-amber-700"; // Bronze
  return "text-gray-400"; // Default
}

/**
 * Gets the appropriate border color class based on rank
 */
export function getBorderColor(rank: number): string {
  if (rank === 1) return "border-amber-500"; // Gold
  if (rank === 2) return "border-gray-400"; // Silver
  if (rank === 3) return "border-amber-700"; // Bronze
  return "border-gray-700"; // Default
}

/**
 * Gets the appropriate tier for a player in a category
 */
export function getPlayerTier(player: PlayerWithTiers, category: string): Tier | undefined {
  return player.tiers.find(t => t.category === category);
}

/**
 * Sort players by points
 */
export function sortPlayersByPoints(players: PlayerWithTiers[]): PlayerWithTiers[] {
  return [...players].sort((a, b) => b.player.points - a.player.points);
}

/**
 * Gets the rank of a player based on their position in the list
 * Ranks are determined strictly by combat points
 */
export function getPlayerRank(player: PlayerWithTiers, players: PlayerWithTiers[]): number {
  // Always sort by points in descending order
  const sortedPlayers = sortPlayersByPoints(players);
  const playerIndex = sortedPlayers.findIndex(p => p.player.id === player.player.id);
  
  if (playerIndex === -1) return 0;
  
  // Players with the same points should have the same rank
  // For example, if two players have the highest points, they both get rank 1
  const playerPoints = player.player.points;
  
  // Find how many players have MORE points than this player
  const higherRankedPlayers = sortedPlayers.filter(p => 
    p.player.points > playerPoints
  ).length;
  
  // The rank is position in the sorted list of unique point values + 1
  return higherRankedPlayers + 1;
}
