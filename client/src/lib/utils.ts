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
 */
export const tierColors: TierColors = {
  "SS": "bg-black border-red-600 text-red-600", // Red (based on the image reference)
  "S": "bg-black border-orange-500 text-orange-500", // Orange
  "A": "bg-black border-amber-500 text-amber-500", // Amber (orange-yellow in image)
  "B": "bg-black border-yellow-400 text-yellow-400", // Yellow
  "C": "bg-black border-green-500 text-green-500", // Green
  "D": "bg-black border-blue-500 text-blue-500", // Blue
  "E": "bg-black border-indigo-500 text-indigo-500", // Indigo
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
