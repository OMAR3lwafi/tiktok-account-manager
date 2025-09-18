import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Heart, Share, MessageCircle, TrendingUp, Users } from "lucide-react";

export function AnalyticsPage() {
  const [selectedAccount, setSelectedAccount] = useState("");
  const backend = useBackend();

  const { data: accountsData } = useQuery({
    queryKey: ["tiktok-accounts"],
    queryFn: () => backend.tiktok.listAccounts(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics", selectedAccount],
    queryFn: () => selectedAccount ? backend.analytics.getAccountAnalytics({ accountId: selectedAccount }) : null,
    enabled: !!selectedAccount,
  });

  const accounts = accountsData?.accounts || [];

  if (accounts.length === 0) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>No TikTok Accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Connect a TikTok account to view analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your TikTok performance</p>
        </div>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-64">
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

      {selectedAccount && analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total video views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total likes received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalShares.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Times shared
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalComments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Comments received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.averageEngagementRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.followerCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Current followers
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Analytics</CardTitle>
              <CardDescription>Performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.dailyAnalytics.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.dailyAnalytics.slice(0, 10).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.engagementRate.toFixed(2)}% engagement
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-medium">{day.views.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Likes</p>
                          <p className="font-medium">{day.likes.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Comments</p>
                          <p className="font-medium">{day.comments.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No analytics data available for this account yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedAccount && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Select a TikTok account to view analytics data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
