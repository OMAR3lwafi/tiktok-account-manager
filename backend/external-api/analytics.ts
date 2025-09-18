import { api, APIError, Header } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { secret } from "encore.dev/config";
import crypto from "crypto";
import db from "../db";

const apiKeySecret = secret("API_KEY_SECRET");

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key + apiKeySecret()).digest("hex");
}

export interface ExternalAnalyticsRequest {
  accountId: string;
  startDate?: Query<string>;
  endDate?: Query<string>;
  apiKey: Header<"X-API-Key">;
}

export interface ExternalAnalyticsResponse {
  accountId: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  averageEngagementRate: number;
  followerCount: number;
}

// Gets analytics data via external API.
export const getAnalytics = api<ExternalAnalyticsRequest, ExternalAnalyticsResponse>(
  { expose: true, method: "GET", path: "/api/analytics/:accountId" },
  async (req) => {
    const { accountId, startDate, endDate, apiKey } = req;

    if (!apiKey) {
      throw APIError.unauthenticated("missing API key");
    }

    // Verify API key
    const keyHash = hashApiKey(apiKey);
    const apiKeyRecord = await db.queryRow<{
      user_id: number;
      permissions: string[];
    }>`
      SELECT user_id, permissions
      FROM api_keys 
      WHERE key_hash = ${keyHash}
    `;

    if (!apiKeyRecord) {
      throw APIError.unauthenticated("invalid API key");
    }

    if (!apiKeyRecord.permissions.includes("read")) {
      throw APIError.permissionDenied("insufficient permissions");
    }

    // Verify account ownership
    const account = await db.queryRow`
      SELECT account_id FROM tiktok_accounts 
      WHERE account_id = ${accountId} AND user_id = ${apiKeyRecord.user_id}
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

    return {
      accountId,
      totalViews: summary?.total_views || 0,
      totalLikes: summary?.total_likes || 0,
      totalShares: summary?.total_shares || 0,
      totalComments: summary?.total_comments || 0,
      averageEngagementRate: summary?.avg_engagement_rate || 0,
      followerCount: summary?.follower_count || 0,
    };
  }
);
