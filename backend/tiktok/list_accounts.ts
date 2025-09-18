import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface TikTokAccount {
  accountId: string;
  tiktokUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: string;
  createdAt: Date;
}

export interface ListAccountsResponse {
  accounts: TikTokAccount[];
}

// Lists all connected TikTok accounts for the authenticated user.
export const listAccounts = api<void, ListAccountsResponse>(
  { auth: true, expose: true, method: "GET", path: "/tiktok/accounts" },
  async () => {
    const auth = getAuthData()!;

    const accounts: TikTokAccount[] = [];
    for await (const row of db.query<{
      account_id: string;
      tiktok_user_id: string;
      username: string;
      display_name: string;
      avatar_url: string;
      status: string;
      created_at: Date;
    }>`
      SELECT account_id, tiktok_user_id, username, display_name, avatar_url, status, created_at
      FROM tiktok_accounts 
      WHERE user_id = ${auth.userId}
      ORDER BY created_at DESC
    `) {
      accounts.push({
        accountId: row.account_id,
        tiktokUserId: row.tiktok_user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        status: row.status,
        createdAt: row.created_at,
      });
    }

    return { accounts };
  }
);
