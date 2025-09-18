import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

export function ConnectTikTokButton() {
  const { toast } = useToast();

  const handleConnect = () => {
    // In a real implementation, this would redirect to TikTok OAuth
    const clientKey = "your-tiktok-client-key"; // This should come from config
    const redirectUri = `${window.location.origin}/tiktok/callback`;
    const scope = "user.info.basic,video.upload,video.list";
    
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    // For demo purposes, show a toast
    toast({
      title: "Connect TikTok Account",
      description: "In a real app, this would redirect to TikTok OAuth",
    });
    
    // window.location.href = authUrl;
  };

  return (
    <Button onClick={handleConnect} className="gap-2">
      <Plus className="h-4 w-4" />
      Connect TikTok Account
    </Button>
  );
}
