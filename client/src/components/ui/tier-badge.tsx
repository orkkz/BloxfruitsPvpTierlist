import React from "react";
import { cn } from "@/lib/utils";
import { tierColors } from "@/lib/utils";
import { TierGrade } from "@/lib/types";
import { Sword, Hammer, Apple, Crosshair, DollarSign } from "lucide-react";

interface TierBadgeProps {
  tier: TierGrade;
  className?: string;
  category?: string;
  showCategoryIcon?: boolean;
}

export function TierBadge({ tier, className, category, showCategoryIcon = false }: TierBadgeProps) {
  const categoryIcons: Record<string, React.ReactNode> = {
    melee: <Hammer className="h-3.5 w-3.5 text-orange-500" />,
    fruit: <Apple className="h-3.5 w-3.5 text-green-500" />,
    sword: <Sword className="h-3.5 w-3.5 text-yellow-400" />,
    gun: <Crosshair className="h-3.5 w-3.5 text-blue-400" />,
    bounty: <DollarSign className="h-3.5 w-3.5 text-red-500" />
  };

  // Use the new design based on the image
  return (
    <div className={cn("relative", className)}>
      {showCategoryIcon && category && (
        <div className="absolute -top-1 -left-1 bg-black rounded-full p-0.5 shadow-md z-10">
          {categoryIcons[category] || null}
        </div>
      )}
      <div 
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2",
          tierColors[tier],
          className
        )}
      >
        {tier}
      </div>
    </div>
  );
}
