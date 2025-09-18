import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Key, Plus, Trash2, Copy } from "lucide-react";

export function SettingsPage() {
  const [newKeyName, setNewKeyName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeysData } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => backend.settings.listApiKeys(),
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (name: string) => backend.settings.createApiKey({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKeyName("");
      setIsDialogOpen(false);
      
      // Copy the key to clipboard
      navigator.clipboard.writeText(data.key!);
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been copied to the clipboard. This is the only time you'll see it!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: number) => backend.settings.deleteApiKey({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const apiKeys = apiKeysData?.apiKeys || [];

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    createApiKeyMutation.mutate(newKeyName.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and API keys</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Create and manage API keys for external access to your TikTok Manager data
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key to access your TikTok Manager data programmatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">API Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateApiKey}
                    disabled={!newKeyName.trim() || createApiKeyMutation.isPending}
                  >
                    {createApiKeyMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No API keys created yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create an API key to access your TikTok Manager data from external applications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <div className="flex gap-1">
                        {apiKey.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                      {apiKey.lastUsed && (
                        <span className="ml-4">
                          Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`tiktok-manager-${apiKey.id}`)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                      disabled={deleteApiKeyMutation.isPending}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            How to use your API keys to access TikTok Manager programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the X-API-Key header:
            </p>
            <code className="block p-3 bg-muted rounded-lg text-sm">
              curl -H "X-API-Key: your-api-key" https://your-app.lp.dev/api/analytics/account-id
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Available Endpoints</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <code className="text-primary">POST /api/upload-video</code>
                <span className="text-muted-foreground">Upload a video</span>
              </div>
              <div className="flex justify-between">
                <code className="text-primary">GET /api/analytics/:accountId</code>
                <span className="text-muted-foreground">Get account analytics</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
