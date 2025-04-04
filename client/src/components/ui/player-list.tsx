import React from "react";
import { PlayerWithTiers, Category } from "@/lib/types";
import { PlayerCard } from "@/components/ui/player-card";
import { getPlayerRank } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerListProps {
  players: PlayerWithTiers[];
  isLoading: boolean;
  category: Category;
}

export function PlayerList({ players, isLoading, category }: PlayerListProps) {
  if (isLoading) {
    return <PlayerListSkeleton />;
  }

  if (players.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">No players found in this category.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-4 font-medium w-16">RANK</th>
            <th className="pb-4 font-medium">PLAYER</th>
            <th className="pb-4 font-medium text-right md:text-center">REGION</th>
            <th className="pb-4 font-medium text-right">TIERS</th>
          </tr>
        </thead>
        <tbody>
          {players.map((playerWithTiers) => {
            const rank = getPlayerRank(playerWithTiers, players);
            return (
              <PlayerCard
                key={playerWithTiers.player.id}
                playerWithTiers={playerWithTiers}
                rank={rank}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlayerListSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-4 font-medium w-16">RANK</th>
            <th className="pb-4 font-medium">PLAYER</th>
            <th className="pb-4 font-medium text-right md:text-center">REGION</th>
            <th className="pb-4 font-medium text-right">TIERS</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b border-gray-800">
              <td className="py-4">
                <Skeleton className="h-8 w-8 rounded-full" />
              </td>
              <td>
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-lg mr-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </td>
              <td className="text-right md:text-center">
                <Skeleton className="h-6 w-12 rounded-md inline-block" />
              </td>
              <td>
                <div className="flex flex-wrap justify-end gap-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
