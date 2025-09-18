import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface ListVideosRequest {
  accountId?: Query<string>;
  status?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface Video {
  id: number;
  accountId: string;
  title: string;
  description?: string;
  filePath?: string;
  url?: string;
  scheduledTime?: Date;
  status: string;
  tiktokVideoId?: string;
  createdAt: Date;
  publishedAt?: Date;
}

export interface ListVideosResponse {
  videos: Video[];
  total: number;
}

// Lists videos for the authenticated user.
export const list = api<ListVideosRequest, ListVideosResponse>(
  { auth: true, expose: true, method: "GET", path: "/videos" },
  async (req) => {
    const auth = getAuthData()!;
    const limit = req.limit || 20;
    const offset = req.offset || 0;

    let whereClause = "WHERE ta.user_id = $1";
    const params: any[] = [auth.userId];

    if (req.accountId) {
      whereClause += " AND v.account_id = $" + (params.length + 1);
      params.push(req.accountId);
    }

    if (req.status) {
      whereClause += " AND v.status = $" + (params.length + 1);
      params.push(req.status);
    }

    const videos: Video[] = [];
    for await (const row of db.rawQuery<{
      id: number;
      account_id: string;
      title: string;
      description: string;
      file_path: string;
      url: string;
      scheduled_time: Date;
      status: string;
      tiktok_video_id: string;
      created_at: Date;
      published_at: Date;
    }>(
      `SELECT v.id, v.account_id, v.title, v.description, v.file_path, v.url, 
              v.scheduled_time, v.status, v.tiktok_video_id, v.created_at, v.published_at
       FROM videos v
       JOIN tiktok_accounts ta ON v.account_id = ta.account_id
       ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params, limit, offset
    )) {
      videos.push({
        id: row.id,
        accountId: row.account_id,
        title: row.title,
        description: row.description || undefined,
        filePath: row.file_path || undefined,
        url: row.url || undefined,
        scheduledTime: row.scheduled_time || undefined,
        status: row.status,
        tiktokVideoId: row.tiktok_video_id || undefined,
        createdAt: row.created_at,
        publishedAt: row.published_at || undefined,
      });
    }

    const totalRow = await db.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM videos v
       JOIN tiktok_accounts ta ON v.account_id = ta.account_id
       ${whereClause}`,
      ...params
    );

    return {
      videos,
      total: totalRow?.count || 0,
    };
  }
);
