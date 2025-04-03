import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { PlayerRankForm } from "@/components/admin/player-rank-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export function AdminPanel() {
  const { isAuthenticated, admin, isLoading, login, logout } = useAuth();

  return (
    <Card className="bg-[#131722] border-gray-700 shadow-xl max-w-md mx-auto">
      <CardContent className="pt-6">
        {isAuthenticated ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
            
            <PlayerRankForm />
          </div>
        ) : (
          <AdminLogin onLogin={login} isLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}
