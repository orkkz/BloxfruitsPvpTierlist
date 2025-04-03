import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { PlayerRankForm } from "@/components/admin/player-rank-form";
import { PlayerManagement } from "@/components/admin/player-management";
import { SiteSettings } from "@/components/admin/site-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Settings, LogOut } from "lucide-react";

export function AdminPanel() {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("add-player");

  return (
    <Card className="bg-[#131722] border-gray-700 shadow-xl max-w-4xl mx-auto">
      <CardContent className="pt-6">
        {user ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
            
            <Tabs defaultValue="add-player" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="add-player" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Player
                </TabsTrigger>
                <TabsTrigger value="manage-players" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Players
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="add-player">
                <PlayerRankForm />
              </TabsContent>
              
              <TabsContent value="manage-players">
                <PlayerManagement />
              </TabsContent>
              
              <TabsContent value="settings">
                <SiteSettings />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <AdminLogin onLogin={(credentials) => loginMutation.mutate(credentials)} isLoading={isLoading || loginMutation.isPending} />
        )}
      </CardContent>
    </Card>
  );
}
