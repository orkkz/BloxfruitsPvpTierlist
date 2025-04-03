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
  Crosshair 
} from "lucide-react";

interface PlayerCardProps {
  playerWithTiers: PlayerWithTiers;
  rank: number;
}

export function PlayerCard({ playerWithTiers, rank }: PlayerCardProps) {
  const { player, tiers } = playerWithTiers;
  
  // Order tiers consistently
  const orderedCategories = ["melee", "fruit", "sword", "gun"];
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
    gun: "text-cyan-500"
  };
  
  // Category icon mapping
  const categoryIcons = {
    melee: <Hammer className="h-4 w-4" />,
    fruit: <Apple className="h-4 w-4" />,
    sword: <Sword className="h-4 w-4" />,
    gun: <Crosshair className="h-4 w-4" />
  };
  
  return (
    <tr className="player-card border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="py-4">
        <span className={`text-2xl font-bold ${medalColor}`}>{rank}</span>
      </td>
      <td>
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-lg overflow-hidden mb-2 border-2 ${borderColor}`}>
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
          <div className="text-center">
            <div className="font-semibold text-white">{player.username || "Unknown Player"}</div>
            <div className="flex items-center justify-center">
              <Award className={`h-4 w-4 mr-1.5 ${medalColor}`} />
              <span className="text-sm text-gray-300">
                {formatCombatTitle(player.combatTitle, player.points)}
              </span>
            </div>
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
              <div className={`flex items-center mb-1 ${categoryColors[tier?.category as keyof typeof categoryColors] || "text-gray-400"}`}>
                {tier?.category && categoryIcons[tier.category as keyof typeof categoryIcons]}
                <span className="text-xs ml-1 font-medium">
                  {tier?.category ? tier.category.charAt(0).toUpperCase() + tier.category.slice(1) : "Unknown"}
                </span>
              </div>
              <TierBadge tier={tier?.tier as TierGrade} />
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}
