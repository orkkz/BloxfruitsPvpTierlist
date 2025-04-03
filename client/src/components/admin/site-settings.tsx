import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateSiteSettings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, RefreshCcw, CheckCircle } from 'lucide-react';

export function SiteSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const { toast } = useToast();
  
  // Load current logo URL from localStorage on component mount
  useEffect(() => {
    const currentLogoUrl = localStorage.getItem('logoUrl') || 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e6/Site-logo.png';
    setLogoUrl(currentLogoUrl);
  }, []);
  
  // Update site settings mutation
  const mutation = useMutation({
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
  
  // Handle save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(logoUrl);
  };
  
  // Handle logo preview refresh
  const handleRefreshPreview = () => {
    // Force a reload of the logo by updating state
    const currentUrl = logoUrl;
    setLogoUrl('');
    setTimeout(() => setLogoUrl(currentUrl), 100);
  };
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Site Settings
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="flex items-center">
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </span>
            ) : mutation.isSuccess ? (
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
  );
}