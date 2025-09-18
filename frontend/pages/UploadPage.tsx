import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Link as LinkIcon } from "lucide-react";

export function UploadPage() {
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const backend = useBackend();
  const { toast } = useToast();

  const { data: accountsData } = useQuery({
    queryKey: ["tiktok-accounts"],
    queryFn: () => backend.tiktok.listAccounts(),
  });

  const accounts = accountsData?.accounts || [];

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !title || !file) return;

    setIsLoading(true);
    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      
      await backend.videos.upload({
        accountId: selectedAccount,
        title,
        description,
        fileData: base64String,
        filename: file.name,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      });

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setScheduledTime("");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !title || !url) return;

    setIsLoading(true);
    try {
      await backend.videos.uploadUrl({
        accountId: selectedAccount,
        title,
        description,
        url,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      });

      toast({
        title: "Success",
        description: "Video URL saved successfully!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setUrl("");
      setScheduledTime("");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to save video URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>No TikTok Accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You need to connect a TikTok account before uploading videos.
            </p>
            <Button>Connect TikTok Account</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Upload Video</h1>
        <p className="text-muted-foreground">Upload or schedule videos for your TikTok accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button
              variant={uploadType === "file" ? "default" : "outline"}
              onClick={() => setUploadType("file")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant={uploadType === "url" ? "default" : "outline"}
              onClick={() => setUploadType("url")}
              className="gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              External URL
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={uploadType === "file" ? handleFileUpload : handleUrlUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">TikTok Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.accountId} value={account.accountId}>
                      <div className="flex items-center gap-2">
                        <img
                          src={account.avatarUrl}
                          alt={account.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{account.displayName} (@{account.username})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            {uploadType === "file" ? (
              <div className="space-y-2">
                <Label htmlFor="file">Video File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Schedule Time (Optional)</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !selectedAccount || !title || (uploadType === "file" ? !file : !url)}
            >
              {isLoading
                ? "Uploading..."
                : scheduledTime
                ? "Schedule Video"
                : "Upload Video"
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
