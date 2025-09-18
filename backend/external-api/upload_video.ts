import { api, APIError, Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import crypto from "crypto";
import db from "../db";
import { videoBucket } from "../shared/storage";

const apiKeySecret = secret("API_KEY_SECRET");

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key + apiKeySecret()).digest("hex");
}

export interface ExternalUploadRequest {
  accountId: string;
  title: string;
  description?: string;
  fileData: string; // Base64 encoded file data
  filename: string;
  scheduledTime?: Date;
  apiKey: Header<"X-API-Key">;
}

export interface ExternalVideo {
  id: number;
  accountId: string;
  title: string;
  description?: string;
  filePath: string;
  scheduledTime?: Date;
  status: string;
  createdAt: Date;
}

// Uploads a video file via external API.
export const uploadVideo = api<ExternalUploadRequest, ExternalVideo>(
  { expose: true, method: "POST", path: "/api/upload-video" },
  async (req) => {
    const { accountId, title, description, fileData, filename, scheduledTime, apiKey } = req;

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

    if (!apiKeyRecord.permissions.includes("write")) {
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

    // Validate file type
    const allowedExtensions = [".mp4", ".mov", ".avi", ".webm"];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      throw APIError.invalidArgument("unsupported file type");
    }

    // Generate unique file path
    const fileId = crypto.randomUUID();
    const filePath = `${accountId}/${fileId}${extension}`;

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // Upload to storage
    await videoBucket.upload(filePath, fileBuffer, {
      contentType: `video/${extension.slice(1)}`,
    });

    // Save to database
    const video = await db.queryRow<{
      id: number;
      account_id: string;
      title: string;
      description: string;
      file_path: string;
      scheduled_time: Date;
      status: string;
      created_at: Date;
    }>`
      INSERT INTO videos (account_id, title, description, file_path, scheduled_time, status)
      VALUES (${accountId}, ${title}, ${description || ""}, ${filePath}, ${scheduledTime}, ${scheduledTime ? "scheduled" : "draft"})
      RETURNING id, account_id, title, description, file_path, scheduled_time, status, created_at
    `;

    if (!video) {
      throw APIError.internal("failed to save video");
    }

    return {
      id: video.id,
      accountId: video.account_id,
      title: video.title,
      description: video.description || undefined,
      filePath: video.file_path,
      scheduledTime: video.scheduled_time || undefined,
      status: video.status,
      createdAt: video.created_at,
    };
  }
);
