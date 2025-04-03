import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TierGrade, Category } from "@/lib/types";
import { addPlayerWithTier } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const playerRankSchema = z.object({
  robloxId: z.string().min(1, "Roblox ID is required"),
  category: z.string().min(1, "Category is required"),
  tier: z.string().min(1, "Tier is required"),
  region: z.string().min(1, "Region is required"),
  combatTitle: z.string().min(1, "Combat Title is required"),
  points: z.string().transform(val => parseInt(val, 10)).optional(),
});

type FormValues = z.infer<typeof playerRankSchema>;

interface RecentUpdate {
  playerName: string;
  category: string;
  tier: string;
  region: string;
  timestamp: Date;
}

export function PlayerRankForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(playerRankSchema),
    defaultValues: {
      robloxId: "",
      category: "melee",
      tier: "SS",
      region: "Global",
      combatTitle: "Combat Master",
      points: "300",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Convert points from string to number
      const pointsValue = values.points ? parseInt(values.points, 10) : 300;
      
      // Get the Roblox user data using our API
      const result = await addPlayerWithTier({
        robloxId: values.robloxId,
        category: values.category,
        tier: values.tier as TierGrade,
        region: values.region,
        combatTitle: values.combatTitle,
        points: pointsValue,
      });
      
      toast({
        title: "Player rank updated",
        description: `Updated ${result.player.username}'s ${values.category} rank to ${values.tier}`,
      });
      
      // Add to recent updates
      setRecentUpdates((prev) => [
        {
          playerName: result.player.username,
          category: values.category,
          tier: values.tier,
          region: values.region,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // Keep only the 10 most recent updates
      ]);
      
      // Reset form
      form.reset({
        robloxId: "",
        category: "melee",
        tier: "SS",
        region: "Global",
        combatTitle: "Combat Master",
        points: "300",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      
    } catch (error) {
      console.error("Error updating player rank:", error);
      toast({
        title: "Error updating player rank",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "melee", label: "Melee" },
    { value: "fruit", label: "Fruit" },
    { value: "sword", label: "Sword" },
    { value: "gun", label: "Gun" },
  ];

  const regions = [
    { value: "Global", label: "Global" },
    { value: "NA", label: "North America" },
    { value: "EU", label: "Europe" },
    { value: "Asia", label: "Asia" },
    { value: "SA", label: "South America" },
    { value: "OCE", label: "Oceania" },
  ];

  const combatTitles = [
    { value: "Combat Master", label: "Combat Master" },
    { value: "Grand Master", label: "Grand Master" },
    { value: "Legendary Pirate", label: "Legendary Pirate" },
    { value: "Rising Star", label: "Rising Star" },
    { value: "Rookie", label: "Rookie" },
  ];

  const tiers = [
    { value: "SS", label: "SS" },
    { value: "S", label: "S" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "E", label: "E" },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "melee": return "text-orange-600";
      case "fruit": return "text-green-500";
      case "sword": return "text-yellow-400";
      case "gun": return "text-cyan-500";
      default: return "text-gray-300";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "SS": return "text-red-600";
      case "S": return "text-orange-600";
      case "A": return "text-amber-500";
      case "B": return "text-yellow-400";
      case "C": return "text-green-500";
      case "D": return "text-cyan-500";
      case "E": return "text-emerald-500";
      default: return "text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="robloxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Roblox Player ID</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-gray-800 border-gray-700 text-white focus:border-amber-500"
                    placeholder="Enter Roblox ID"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Region</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-amber-500">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="combatTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Combat Title</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-amber-500">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {combatTitles.map((title) => (
                        <SelectItem key={title.value} value={title.value}>
                          {title.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Combat Points</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white focus:border-amber-500"
                    placeholder="Enter points (e.g., 300)"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Category</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-amber-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Tier</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-amber-500">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {tiers.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Player Rank"
            )}
          </Button>
        </form>
      </Form>
      
      {recentUpdates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Recent Updates</h3>
          <div className="bg-gray-800 rounded p-2 max-h-40 overflow-y-auto text-sm">
            {recentUpdates.map((update, index) => (
              <div
                key={index}
                className="text-gray-400 py-1 border-b border-gray-700 last:border-b-0"
              >
                <span className="text-white">{update.playerName}</span> ({update.region}) - Updated{" "}
                <span className={getCategoryColor(update.category)}>
                  {update.category.charAt(0).toUpperCase() + update.category.slice(1)}
                </span>{" "}
                to{" "}
                <span className={`font-medium ${getTierColor(update.tier)}`}>
                  {update.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
