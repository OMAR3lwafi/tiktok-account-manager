import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface DisconnectRequest {
  accountId: string;
}

// Disconnects a TikTok account.
export const disconnect = api<DisconnectRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/tiktok/disconnect" },
  async (req) => {
    const auth = getAuthData()!;
    const { accountId } = req;

    const account = await db.queryRow`
      SELECT account_id FROM tiktok_accounts 
      WHERE account_id = ${accountId} AND user_id = ${auth.userId}
    `;

    if (!account) {
      throw APIError.notFound("TikTok account not found");
    }

    await db.exec`
      DELETE FROM tiktok_accounts WHERE account_id = ${accountId}
    `;
  }
);
