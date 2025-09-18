import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Users, Video, BarChart3, Calendar } from "lucide-react";
import { ConnectTikTokButton } from "../components/ConnectTikTokButton";

export function DashboardPage() {
  const backend = useBackend();

  const { data: accountsData } = useQuery({
    queryKey: ["tiktok-accounts"],
    queryFn: () => backend.tiktok.listAccounts(),
  });

  const { data: videosData } = useQuery({
    queryKey: ["videos"],
    queryFn: () => backend.videos.list({}),
  });

  const accounts = accountsData?.accounts || [];
  const videos = videosData?.videos || [];
  const totalVideos = videosData?.total || 0;

  const scheduledVideos = videos.filter(v => v.status === "scheduled").length;
  const publishedVideos = videos.filter(v => v.status === "published").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your TikTok accounts and content</p>
        </div>
        <div className="flex gap-3">
          <ConnectTikTokButton />
          <Link to="/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Video
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              TikTok accounts connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              Videos uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledVideos}</div>
            <p className="text-xs text-muted-foreground">
              Videos scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedVideos}</div>
            <p className="text-xs text-muted-foreground">
              Videos published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Your TikTok accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No TikTok accounts connected yet</p>
                <ConnectTikTokButton />
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.slice(0, 3).map((account) => (
                  <Link
                    key={account.accountId}
                    to={`/account/${account.accountId}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <img
                      src={account.avatarUrl}
                      alt={account.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{account.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{account.username}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      account.status === "active" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {account.status}
                    </div>
                  </Link>
                ))}
                {accounts.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{accounts.length - 3} more accounts
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Videos</CardTitle>
            <CardDescription>Your latest uploads</CardDescription>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No videos uploaded yet</p>
                <Link to="/upload">
                  <Button>Upload Your First Video</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.slice(0, 5).map((video) => (
                  <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      video.status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : video.status === "scheduled"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}>
                      {video.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
