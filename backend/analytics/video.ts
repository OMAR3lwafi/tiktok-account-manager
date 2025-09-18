import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface VideoAnalyticsRequest {
  videoId: number;
}

export interface VideoAnalyticsResponse {
  videoId: number;
  title: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  publishedAt?: Date;
}

// Gets analytics data for a specific video.
export const getVideoAnalytics = api<VideoAnalyticsRequest, VideoAnalyticsResponse>(
  { auth: true, expose: true, method: "GET", path: "/analytics/video/:videoId" },
  async (req) => {
    const auth = getAuthData()!;
    const { videoId } = req;

    // Verify video ownership
    const video = await db.queryRow<{
      id: number;
      title: string;
      published_at: Date;
    }>`
      SELECT v.id, v.title, v.published_at
      FROM videos v
      JOIN tiktok_accounts ta ON v.account_id = ta.account_id
      WHERE v.id = ${videoId} AND ta.user_id = ${auth.userId}
    `;

    if (!video) {
      throw APIError.notFound("video not found");
    }

    // Get analytics data
    const analytics = await db.queryRow<{
      total_views: number;
      total_likes: number;
      total_shares: number;
      total_comments: number;
      engagement_rate: number;
    }>`
      SELECT 
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(shares), 0) as total_shares,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(AVG(engagement_rate), 0) as engagement_rate
      FROM analytics 
      WHERE video_id = ${videoId}
    `;

    return {
      videoId: video.id,
      title: video.title,
      totalViews: analytics?.total_views || 0,
      totalLikes: analytics?.total_likes || 0,
      totalShares: analytics?.total_shares || 0,
      totalComments: analytics?.total_comments || 0,
      engagementRate: analytics?.engagement_rate || 0,
      publishedAt: video.published_at || undefined,
    };
  }
);
