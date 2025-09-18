import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Eye, Heart, Share, MessageCircle } from "lucide-react";

export function AccountDetailsPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const backend = useBackend();

  const { data: accountsData } = useQuery({
    queryKey: ["tiktok-accounts"],
    queryFn: () => backend.tiktok.listAccounts(),
  });

  const { data: videosData } = useQuery({
    queryKey: ["videos", accountId],
    queryFn: () => backend.videos.list({ accountId }),
    enabled: !!accountId,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics", accountId],
    queryFn: () => accountId ? backend.analytics.getAccountAnalytics({ accountId }) : null,
    enabled: !!accountId,
  });

  const account = accountsData?.accounts.find(a => a.accountId === accountId);
  const videos = videosData?.videos || [];

  if (!account) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Account Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              The requested TikTok account was not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={account.avatarUrl}
          alt={account.username}
          className="w-16 h-16 rounded-full"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{account.displayName}</h1>
          <p className="text-muted-foreground">@{account.username}</p>
          <Badge variant={account.status === "active" ? "default" : "destructive"}>
            {account.status}
          </Badge>
        </div>
        <Button variant="outline">Disconnect Account</Button>
      </div>

      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.averageEngagementRate.toFixed(2)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.followerCount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Videos</CardTitle>
          <CardDescription>Videos uploaded to this account</CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No videos uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(video.createdAt).toLocaleDateString()}</span>
                        {video.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {new Date(video.scheduledTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      video.status === "published"
                        ? "default"
                        : video.status === "scheduled"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {video.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
