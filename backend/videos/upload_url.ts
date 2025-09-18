import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UploadUrlRequest {
  accountId: string;
  title: string;
  description?: string;
  url: string;
  scheduledTime?: Date;
}

export interface Video {
  id: number;
  accountId: string;
  title: string;
  description?: string;
  url: string;
  scheduledTime?: Date;
  status: string;
  createdAt: Date;
}

// Creates a video record with an external URL.
export const uploadUrl = api<UploadUrlRequest, Video>(
  { auth: true, expose: true, method: "POST", path: "/videos/upload-url" },
  async (req) => {
    const auth = getAuthData()!;
    const { accountId, title, description, url, scheduledTime } = req;

    // Verify account ownership
    const account = await db.queryRow`
      SELECT account_id FROM tiktok_accounts 
      WHERE account_id = ${accountId} AND user_id = ${auth.userId}
    `;

    if (!account) {
      throw APIError.notFound("TikTok account not found");
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw APIError.invalidArgument("invalid URL");
    }

    // Save to database
    const video = await db.queryRow<{
      id: number;
      account_id: string;
      title: string;
      description: string;
      url: string;
      scheduled_time: Date;
      status: string;
      created_at: Date;
    }>`
      INSERT INTO videos (account_id, title, description, url, scheduled_time, status)
      VALUES (${accountId}, ${title}, ${description || ""}, ${url}, ${scheduledTime}, ${scheduledTime ? "scheduled" : "draft"})
      RETURNING id, account_id, title, description, url, scheduled_time, status, created_at
    `;

    if (!video) {
      throw APIError.internal("failed to save video");
    }

    return {
      id: video.id,
      accountId: video.account_id,
      title: video.title,
      description: video.description || undefined,
      url: video.url,
      scheduledTime: video.scheduled_time || undefined,
      status: video.status,
      createdAt: video.created_at,
    };
  }
);
