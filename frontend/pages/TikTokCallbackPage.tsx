import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export function TikTokCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        toast({
          title: "Error",
          description: "TikTok authorization was denied",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      if (!code) {
        toast({
          title: "Error", 
          description: "No authorization code received",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/tiktok/callback`;
        
        await backend.tiktok.connect({
          code,
          redirectUri,
        });

        toast({
          title: "Success",
          description: "TikTok account connected successfully!",
        });

        navigate("/dashboard");
      } catch (error) {
        console.error("Connection error:", error);
        toast({
          title: "Error",
          description: "Failed to connect TikTok account",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, backend, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle>Connecting TikTok Account</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing authorization...</span>
            </div>
          ) : (
            <span>Redirecting...</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}