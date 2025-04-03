import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/ui/navigation-bar";
import { CategoryFilters } from "@/components/ui/category-filters";
import { PlayerList } from "@/components/ui/player-list";
import { Category, PlayerWithTiers } from "@/lib/types";
import { getPlayers, searchPlayers } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Rankings() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("overall");
  const [searchResults, setSearchResults] = useState<PlayerWithTiers[] | null>(null);
  const { toast } = useToast();
  
  const { data: players, isLoading } = useQuery({
    queryKey: ['/api/players', selectedCategory],
    queryFn: () => getPlayers(selectedCategory === "overall" ? undefined : selectedCategory),
  });
  
  // Reset search results when category changes
  useEffect(() => {
    setSearchResults(null);
  }, [selectedCategory]);
  
  const handleSearch = async (query: string) => {
    try {
      const results = await searchPlayers(query);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No players found matching "${query}"`,
        });
        return;
      }
      
      // Convert search results to PlayerWithTiers format
      const playersWithTiers: PlayerWithTiers[] = results.map(player => ({
        player,
        tiers: []
      }));
      
      setSearchResults(playersWithTiers);
      
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search error",
        description: error instanceof Error ? error.message : "Failed to search players",
        variant: "destructive",
      });
    }
  };
  
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSearchResults(null); // Clear search results when changing category
  };
  
  // Determine which players to display - search results or fetched players
  const displayedPlayers = searchResults || players || [];
  
  return (
    <div className="min-h-screen bg-[#131722] text-white">
      <NavigationBar onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white">Bloxfruits PVP Tierlist</h1>
          
          <CategoryFilters 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        
        <PlayerList 
          players={displayedPlayers}
          isLoading={isLoading}
          category={selectedCategory}
        />
      </main>
    </div>
  );
}
