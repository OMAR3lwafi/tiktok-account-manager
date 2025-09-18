import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { getAuthData } from "~encore/auth";
import crypto from "crypto";
import db from "../db";

const encryptionKey = secret("DATABASE_ENCRYPTION_KEY");

function encrypt(text: string): string {
  const ALGORITHM = "aes-256-gcm";
  const key = Buffer.from(encryptionKey(), 'utf8').subarray(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

const clientKey = secret("TIKTOK_CLIENT_KEY");
const clientSecret = secret("TIKTOK_CLIENT_SECRET");

export interface ConnectRequest {
  code: string;
  redirectUri: string;
}

export interface TikTokAccount {
  accountId: string;
  tiktokUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: string;
}

// Connects a TikTok account using OAuth code.
export const connect = api<ConnectRequest, TikTokAccount>(
  { auth: true, expose: true, method: "POST", path: "/tiktok/connect" },
  async (req) => {
    const auth = getAuthData()!;
    const { code, redirectUri } = req;

    // Exchange code for access token
    const tokenResponse = await fetch("https://sandbox-open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientKey(),
        client_secret: clientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenResponse.ok) {
      throw APIError.invalidArgument("failed to exchange code for token");
    }

    // Get user info
    const userResponse = await fetch("https://sandbox-open.tiktokapis.com/v2/user/info/", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json() as any;
    if (!userResponse.ok) {
      throw APIError.invalidArgument("failed to get user info");
    }

    const user = userData.data.user;
    const accountId = crypto.randomUUID();

    // Check if account already exists
    const existingAccount = await db.queryRow`
      SELECT account_id FROM tiktok_accounts WHERE tiktok_user_id = ${user.open_id}
    `;

    if (existingAccount) {
      throw APIError.alreadyExists("TikTok account already connected");
    }

    // Store encrypted tokens
    const accessTokenEncrypted = encrypt(tokenData.access_token);
    const refreshTokenEncrypted = encrypt(tokenData.refresh_token);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.exec`
      INSERT INTO tiktok_accounts (
        account_id, user_id, tiktok_user_id, username, display_name, 
        avatar_url, access_token_encrypted, refresh_token_encrypted, expires_at
      )
      VALUES (
        ${accountId}, ${auth.userId}, ${user.open_id}, ${user.username}, 
        ${user.display_name}, ${user.avatar_url}, ${accessTokenEncrypted}, 
        ${refreshTokenEncrypted}, ${expiresAt}
      )
    `;

    return {
      accountId,
      tiktokUserId: user.open_id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      status: "active",
    };
  }
);
