// Client-side types

export type TierGrade = "SS" | "S" | "A" | "B" | "C" | "D" | "E";

export type Category = "overall" | "melee" | "fruit" | "sword" | "gun" | "bounty";

export interface Player {
  id: number;
  robloxId: string;
  username: string;
  avatarUrl: string;
  combatTitle: string;
  points: number;
  region: string;
  bounty?: string;
}

export interface Tier {
  id: number;
  playerId: number;
  category: string;
  tier: TierGrade;
}

export interface PlayerWithTiers {
  player: Player;
  tiers: Tier[];
}

export interface AdminUser {
  id: number;
  username: string;
}

export interface RobloxUserResponse {
  Id: number;
  Username: string;
  AvatarUri: string;
  IsOnline: boolean;
}

export interface RobloxUser {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin: AdminUser;
}

export interface NewPlayerData {
  robloxId: string;
  category: string;
  tier: TierGrade;
  region?: string;
  combatTitle?: string;
  points?: number;
  bounty?: string;
  // Manual input fields
  useManualInput?: boolean;
  manualUsername?: string;
  manualDisplayName?: string;
  manualAvatarUrl?: string;
}

export interface CategoryOption {
  value: Category;
  label: string;
  icon: JSX.Element;
}

export interface TierColors {
  [key: string]: string;
}
