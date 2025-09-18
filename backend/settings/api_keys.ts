import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import crypto from "crypto";
import db from "../db";

const apiKeySecret = secret("API_KEY_SECRET");

function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key + apiKeySecret()).digest("hex");
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
}

export interface ApiKey {
  id: number;
  name: string;
  key?: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKey[];
}

// Creates a new API key for the authenticated user.
export const createApiKey = api<CreateApiKeyRequest, ApiKey>(
  { auth: true, expose: true, method: "POST", path: "/settings/api-keys" },
  async (req) => {
    const auth = getAuthData()!;
    const { name, permissions = ["read", "write"] } = req;

    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    const apiKey = await db.queryRow<{
      id: number;
      name: string;
      permissions: string[];
      created_at: Date;
    }>`
      INSERT INTO api_keys (user_id, key_hash, name, permissions)
      VALUES (${auth.userId}, ${keyHash}, ${name}, ${JSON.stringify(permissions)})
      RETURNING id, name, permissions, created_at
    `;

    if (!apiKey) {
      throw APIError.internal("failed to create API key");
    }

    return {
      id: apiKey.id,
      name: apiKey.name,
      key,
      permissions: apiKey.permissions,
      createdAt: apiKey.created_at,
    };
  }
);

// Lists all API keys for the authenticated user.
export const listApiKeys = api<void, ListApiKeysResponse>(
  { auth: true, expose: true, method: "GET", path: "/settings/api-keys" },
  async () => {
    const auth = getAuthData()!;

    const apiKeys: ApiKey[] = [];
    for await (const row of db.query<{
      id: number;
      name: string;
      permissions: string[];
      created_at: Date;
      last_used: Date;
    }>`
      SELECT id, name, permissions, created_at, last_used
      FROM api_keys 
      WHERE user_id = ${auth.userId}
      ORDER BY created_at DESC
    `) {
      apiKeys.push({
        id: row.id,
        name: row.name,
        permissions: row.permissions,
        createdAt: row.created_at,
        lastUsed: row.last_used || undefined,
      });
    }

    return { apiKeys };
  }
);

// Deletes an API key.
export const deleteApiKey = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/settings/api-keys/:id" },
  async (req) => {
    const auth = getAuthData()!;
    const { id } = req;

    await db.exec`
      DELETE FROM api_keys WHERE id = ${id} AND user_id = ${auth.userId}
    `;
  }
);
