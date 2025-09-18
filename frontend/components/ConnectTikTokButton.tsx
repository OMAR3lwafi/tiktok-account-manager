import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../contexts/AuthContext";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ConnectTikTokButton() {
  const { toast } = useToast();
  const backend = useBackend();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/tiktok/callback`;
      
      // Get the secure OAuth URL from backend
      const response = await backend.tiktok.getAuthUrl({ redirectUri });
      
      // Redirect to TikTok OAuth
      window.location.href = response.authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      toast({
        title: "Error",
        description: "Failed to initialize TikTok connection",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isLoading} className="gap-2">
      <Plus className="h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect TikTok Account"}
    </Button>
  );
}
