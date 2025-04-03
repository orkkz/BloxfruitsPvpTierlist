import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayers, deletePlayer, updatePlayer } from '@/lib/api';
import { PlayerWithTiers, Player } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function PlayerManagement() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Player>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch players
  const { data: playersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/players'],
    queryFn: () => getPlayers(),
  });

  // Delete player mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: 'Success',
        description: 'Player deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Update player mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) => updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Player updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Handle delete player
  const handleDeletePlayer = (id: number) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle edit player
  const handleEditClick = (player: Player) => {
    setCurrentPlayer(player);
    setEditFormData({
      username: player.username,
      robloxId: player.robloxId,
      avatarUrl: player.avatarUrl,
      combatTitle: player.combatTitle || '',
      points: player.points || 0,
      region: player.region || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'points' ? Number(value) : value,
    }));
  };

  // Handle save changes
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlayer) {
      updateMutation.mutate({
        id: currentPlayer.id,
        data: editFormData,
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading players...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>Failed to load players. Please try again.</AlertDescription>
      </Alert>
    );
  }

  const players = playersData || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Player Management</h3>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {players.length === 0 ? (
        <Alert>
          <AlertDescription>No players found. Add players using the form above.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {players.map(({ player }) => (
            <Card key={player.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded overflow-hidden">
                      <img
                        src={player.avatarUrl}
                        alt={player.username}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png";
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{player.username}</h4>
                      <p className="text-sm text-gray-400">
                        Region: {player.region || 'Unknown'} • Points: {player.points || 0}
                      </p>
                      <p className="text-xs text-gray-500">RobloxID: {player.robloxId}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(player)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Player</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={editFormData.username || ''}
                  onChange={handleEditFormChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="robloxId">Roblox ID</Label>
                <Input
                  id="robloxId"
                  name="robloxId"
                  value={editFormData.robloxId || ''}
                  onChange={handleEditFormChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  value={editFormData.avatarUrl || ''}
                  onChange={handleEditFormChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="combatTitle">Combat Title</Label>
                  <Input
                    id="combatTitle"
                    name="combatTitle"
                    value={editFormData.combatTitle || ''}
                    onChange={handleEditFormChange}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    name="points"
                    type="number"
                    value={editFormData.points || 0}
                    onChange={handleEditFormChange}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  name="region"
                  value={editFormData.region || ''}
                  onChange={handleEditFormChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}