import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { updateSiteSettings, getDatabaseStats, resetDatabase } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, RefreshCcw, CheckCircle, Database, Loader2, AlertTriangle } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SiteSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Load current logo URL from localStorage on component mount
  useEffect(() => {
    const currentLogoUrl = localStorage.getItem('logoUrl') || 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e6/Site-logo.png';
    setLogoUrl(currentLogoUrl);
  }, []);
  
  // Get database stats query
  const dbStatsQuery = useQuery({
    queryKey: ['/api/database/stats'],
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Update site settings mutation
  const logoMutation = useMutation({
    mutationFn: (url: string) => updateSiteSettings(url),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Logo URL updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update logo URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Reset database mutation
  const resetMutation = useMutation({
    mutationFn: () => resetDatabase(),
    onSuccess: (data) => {
      toast({
        title: 'Database Reset',
        description: data.message,
      });
      // Refetch stats
      dbStatsQuery.refetch();
      // Close dialog
      setIsResetDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reset database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      // Close dialog
      setIsResetDialogOpen(false);
    },
  });
  
  // Handle save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    logoMutation.mutate(logoUrl);
  };
  
  // Handle logo preview refresh
  const handleRefreshPreview = () => {
    // Force a reload of the logo by updating state
    const currentUrl = logoUrl;
    setLogoUrl('');
    setTimeout(() => setLogoUrl(currentUrl), 100);
  };
  
  // Handle database reset
  const handleResetDatabase = () => {
    resetMutation.mutate();
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Appearance Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Enter logo URL"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="pt-2">
                <Label>Logo Preview</Label>
                <div className="mt-2 p-4 bg-gray-800 rounded-md flex flex-col items-center justify-center relative">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRefreshPreview}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <div className="h-16 w-auto">
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/200x100/text=Invalid+URL";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={logoMutation.isPending}
            >
              {logoMutation.isPending ? (
                <span className="flex items-center">
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </span>
              ) : logoMutation.isSuccess ? (
                <span className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Database Management Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage database connections and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbStatsQuery.isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-400">Loading database information...</p>
            </div>
          ) : dbStatsQuery.isError ? (
            <div className="text-center py-6 text-red-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Error loading database information</p>
              <p className="text-sm mt-1 text-gray-400">
                {dbStatsQuery.error instanceof Error ? dbStatsQuery.error.message : 'An unknown error occurred'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4" 
                onClick={() => dbStatsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">Database Type</p>
                  <p className="font-medium">{dbStatsQuery.data?.stats.type || 'Unknown'}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${dbStatsQuery.data?.stats.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-medium">{dbStatsQuery.data?.stats.status || 'Unknown'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">Players</p>
                  <p className="font-medium text-xl">{dbStatsQuery.data?.stats.playerCount || 0}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">Tiers</p>
                  <p className="font-medium text-xl">{dbStatsQuery.data?.stats.tierCount || 0}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">Admins</p>
                  <p className="font-medium text-xl">{dbStatsQuery.data?.stats.adminCount || 0}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-4 mt-4">
                <p className="text-gray-300 font-medium mb-2">Database Operations</p>
                
                {/* Reset Database Alert Dialog */}
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Reset Database
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all player data, tiers, and admins (except the default super admin).
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-700 hover:bg-gray-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={(e) => {
                          e.preventDefault();
                          handleResetDatabase();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {resetMutation.isPending ? 
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline-block" /> : 
                          null
                        }
                        Reset Database
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}