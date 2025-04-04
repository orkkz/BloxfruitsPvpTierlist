import React from "react";
import { 
  PlayerWithTiers, 
  TierGrade 
} from "@/lib/types";
import { 
  getMedalColor, 
  getBorderColor, 
  formatCombatTitle, 
  regionColors 
} from "@/lib/utils";
import { TierBadge } from "@/components/ui/tier-badge";
import { 
  Award, 
  Sword, 
  Hammer, 
  Apple, 
  Crosshair,
  DollarSign
} from "lucide-react";

interface PlayerCardProps {
  playerWithTiers: PlayerWithTiers;
  rank: number;
}

export function PlayerCard({ playerWithTiers, rank }: PlayerCardProps) {
  const { player, tiers } = playerWithTiers;
  
  // Order tiers consistently
  const orderedCategories = ["melee", "fruit", "sword", "gun", "bounty"];
  const orderedTiers = orderedCategories
    .map(category => tiers.find(tier => tier.category === category))
    .filter(Boolean);
  
  const medalColor = getMedalColor(rank);
  const borderColor = getBorderColor(rank);
  
  // Category color mapping
  const categoryColors = {
    melee: "text-orange-600",
    fruit: "text-green-500",
    sword: "text-yellow-400",
    gun: "text-cyan-500",
    bounty: "text-red-500"
  };
  
  // Category icon mapping
  const categoryIcons = {
    melee: <Hammer className="h-4 w-4" />,
    fruit: <Apple className="h-4 w-4" />,
    sword: <Sword className="h-4 w-4" />,
    gun: <Crosshair className="h-4 w-4" />,
    bounty: <DollarSign className="h-4 w-4" />
  };
  
  // Function to format rank as 1st, 2nd, 3rd, etc. with proper suffix
  const formatRank = (rank: number): string => {
    if (rank % 100 >= 11 && rank % 100 <= 13) {
      return `${rank}th`; // 11th, 12th, 13th
    }
    
    switch (rank % 10) {
      case 1: return `${rank}st`;
      case 2: return `${rank}nd`;
      case 3: return `${rank}rd`;
      default: return `${rank}th`;
    }
  };

  return (
    <tr className="player-card border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="py-4">
        <span className={`text-2xl font-bold ${medalColor}`}>{formatRank(rank)}</span>
      </td>
      <td>
        <div className="flex items-center">
          <a 
            href={`https://www.roblox.com/users/${player.robloxId}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className={`w-14 h-14 rounded-lg overflow-hidden mr-3 border-2 ${borderColor} hover:opacity-90 transition-opacity`}>
              <img 
                src={player.avatarUrl} 
                alt={`${player.username}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.target as HTMLImageElement;
                  target.src = "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png";
                }}
              />
            </div>
          </a>
          <div>
            {/* Display name in title font with clickable link */}
            <a 
              href={`https://www.roblox.com/users/${player.robloxId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-white hover:text-amber-400 transition-colors"
            >
              {player.username || "Unknown Player"}
            </a>
            {/* Username in subtitle font */}
            <div className="text-sm text-gray-400 -mt-0.5 mb-0.5">@{player.username || "unknown"}</div>
            <div className="flex items-center">
              <Award className={`h-4 w-4 mr-1.5 ${medalColor}`} />
              <span className="text-xs text-gray-300">
                {formatCombatTitle(player.combatTitle, player.points)}
              </span>
            </div>
            {/* Display bounty if available */}
            {player.bounty && player.bounty !== "0" && (
              <div className="flex items-center mt-1">
                <div className="flex items-center px-2 py-0.5 bg-[#1a0505] border border-red-800 rounded text-red-500 text-xs">
                  <DollarSign className="h-3 w-3 mr-0.5 text-red-500" />
                  <span className="font-bold">{player.bounty}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="text-right md:text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${regionColors[player.region] || "bg-gray-600"}`}>
          {player.region || "Unknown"}
        </span>
      </td>
      <td>
        <div className="flex flex-wrap justify-end gap-2 md:gap-3">
          {orderedTiers.map((tier, index) => (
            <div key={index} className="flex flex-col items-center">
              {tier?.category === "bounty" && tier?.tier ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 bg-[#1a0505] border-red-800 text-red-500 relative">
                  {tier.tier}
                  <div className="absolute -top-1 -left-1 bg-black rounded-full p-0.5 shadow-md z-10">
                    <DollarSign className="h-3.5 w-3.5 text-red-500" />
                  </div>
                </div>
              ) : (
                <TierBadge 
                  tier={tier?.tier as TierGrade} 
                  category={tier?.category} 
                  showCategoryIcon={true} 
                />
              )}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}
