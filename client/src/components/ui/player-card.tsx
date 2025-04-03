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
import { Award } from "lucide-react";

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
  
  return (
    <tr className="player-card border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
      <td className="py-4">
        <span className={`text-2xl font-bold ${medalColor}`}>{rank}</span>
      </td>
      <td>
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg overflow-hidden mr-3 border-2 ${borderColor}`}>
            <img 
              src={player.avatarUrl} 
              alt={`${player.username}'s avatar`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.src = "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/150/150/Image/Png";
              }}
            />
          </div>
          <div>
            <div className="font-semibold text-white">{player.username}</div>
            <div className="flex items-center">
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
          {player.region}
        </span>
      </td>
      <td>
        <div className="flex flex-wrap justify-end gap-1 md:gap-2">
          {orderedTiers.map((tier, index) => (
            <TierBadge key={index} tier={tier?.tier as TierGrade} />
          ))}
        </div>
      </td>
    </tr>
  );
}
