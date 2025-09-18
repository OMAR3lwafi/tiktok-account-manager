import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface AccountAnalyticsRequest {
  accountId: string;
  startDate?: Query<string>;
  endDate?: Query<string>;
}

export interface DailyAnalytics {
  date: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  followerCount: number;
}

export interface AccountAnalyticsResponse {
  accountId: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  averageEngagementRate: number;
  followerCount: number;
  dailyAnalytics: DailyAnalytics[];
}

// Gets analytics data for a specific TikTok account.
export const getAccountAnalytics = api<AccountAnalyticsRequest, AccountAnalyticsResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/account/:accountId" },
  async (req) => {
    const auth = getAuthData()!;
    const { accountId, startDate, endDate } = req;

    // Verify account ownership
    const account = await db.queryRow`
      SELECT account_id FROM tiktok_accounts 
      WHERE account_id = ${accountId} AND user_id = ${auth.userId}
    `;

    if (!account) {
      throw APIError.notFound("TikTok account not found");
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get summary analytics
    const summary = await db.queryRow<{
      total_views: number;
      total_likes: number;
      total_shares: number;
      total_comments: number;
      avg_engagement_rate: number;
      follower_count: number;
    }>`
      SELECT 
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(shares), 0) as total_shares,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate,
        COALESCE(MAX(follower_count), 0) as follower_count
      FROM analytics 
      WHERE account_id = ${accountId} 
      AND date >= ${start.toISOString().split('T')[0]}
      AND date <= ${end.toISOString().split('T')[0]}
    `;

    // Get daily analytics
    const dailyAnalytics: DailyAnalytics[] = [];
    for await (const row of db.query<{
      date: string;
      views: number;
      likes: number;
      shares: number;
      comments: number;
      engagement_rate: number;
      follower_count: number;
    }>`
      SELECT 
        date::text,
        COALESCE(SUM(views), 0) as views,
        COALESCE(SUM(likes), 0) as likes,
        COALESCE(SUM(shares), 0) as shares,
        COALESCE(SUM(comments), 0) as comments,
        COALESCE(AVG(engagement_rate), 0) as engagement_rate,
        COALESCE(MAX(follower_count), 0) as follower_count
      FROM analytics 
      WHERE account_id = ${accountId}
      AND date >= ${start.toISOString().split('T')[0]}
      AND date <= ${end.toISOString().split('T')[0]}
      GROUP BY date
      ORDER BY date DESC
    `) {
      dailyAnalytics.push({
        date: row.date,
        views: row.views,
        likes: row.likes,
        shares: row.shares,
        comments: row.comments,
        engagementRate: row.engagement_rate,
        followerCount: row.follower_count,
      });
    }

    return {
      accountId,
      totalViews: summary?.total_views || 0,
      totalLikes: summary?.total_likes || 0,
      totalShares: summary?.total_shares || 0,
      totalComments: summary?.total_comments || 0,
      averageEngagementRate: summary?.avg_engagement_rate || 0,
      followerCount: summary?.follower_count || 0,
      dailyAnalytics,
    };
  }
);
