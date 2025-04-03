import React from "react";
import { cn } from "@/lib/utils";
import { TierGrade, tierColors } from "@/lib/utils";

interface TierBadgeProps {
  tier: TierGrade;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <div 
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md",
        tierColors[tier],
        className
      )}
    >
      {tier}
    </div>
  );
}
