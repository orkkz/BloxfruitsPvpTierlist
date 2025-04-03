import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Category, CategoryOption } from "@/lib/types";
import { Trophy, Sword, Umbrella, Hammer, Crosshair } from "lucide-react";

interface CategoryFiltersProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function CategoryFilters({
  selectedCategory,
  onCategoryChange,
}: CategoryFiltersProps) {
  const categories: CategoryOption[] = [
    {
      value: "overall",
      label: "Overall",
      icon: <Trophy className="h-5 w-5 text-amber-500" />,
    },
    {
      value: "melee",
      label: "Melee",
      icon: <Hammer className="h-5 w-5 text-orange-600" />,
    },
    {
      value: "fruit",
      label: "Fruit",
      icon: <Umbrella className="h-5 w-5 text-green-500" />,
    },
    {
      value: "sword",
      label: "Sword",
      icon: <Sword className="h-5 w-5 text-yellow-400" />,
    },
    {
      value: "gun",
      label: "Gun",
      icon: <Crosshair className="h-5 w-5 text-cyan-500" />,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 md:gap-4">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant="ghost"
          size="icon"
          className={cn(
            "bg-[#0A0C12] rounded-full p-3 transition-all",
            selectedCategory === category.value
              ? "scale-110 brightness-125 ring-2 ring-amber-500/50"
              : "hover:scale-105"
          )}
          onClick={() => onCategoryChange(category.value)}
          aria-label={`Filter by ${category.label}`}
        >
          {category.icon}
        </Button>
      ))}
    </div>
  );
}
