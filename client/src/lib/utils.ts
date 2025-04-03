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
  "SS": "bg-red-600 text-white", // Red
  "S": "bg-orange-600 text-white", // Orange
  "A": "bg-amber-500 text-white", // Amber
  "B": "bg-yellow-400 text-black", // Yellow
  "C": "bg-green-500 text-white", // Green
  "D": "bg-cyan-500 text-white", // Cyan
  "E": "bg-emerald-500 text-white", // Emerald
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
 */
export function getPlayerRank(player: PlayerWithTiers, players: PlayerWithTiers[]): number {
  const sortedPlayers = sortPlayersByPoints(players);
  const playerIndex = sortedPlayers.findIndex(p => p.player.id === player.player.id);
  
  if (playerIndex === -1) return 0;
  
  // Handle ties (same points)
  const currentPoints = player.player.points;
  let samePointsIndex = 0;
  
  for (let i = 0; i < playerIndex; i++) {
    if (sortedPlayers[i].player.points === currentPoints) {
      samePointsIndex = i;
      break;
    }
  }
  
  return playerIndex === samePointsIndex ? playerIndex + 1 : samePointsIndex + 1;
}
