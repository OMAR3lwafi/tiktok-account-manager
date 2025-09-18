import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const clientKey = secret("TIKTOK_CLIENT_KEY");

export interface GetAuthUrlRequest {
  redirectUri: string;
}

export interface GetAuthUrlResponse {
  authUrl: string;
}

// Gets the TikTok OAuth authorization URL.
export const getAuthUrl = api<GetAuthUrlRequest, GetAuthUrlResponse>(
  { auth: true, expose: true, method: "POST", path: "/tiktok/auth-url" },
  async (req) => {
    const { redirectUri } = req;
    const scope = "user.info.basic,video.upload,video.list";
    
    const authUrl = `https://sandbox-www.tiktok.com/auth/authorize/?client_key=${clientKey()}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    return { authUrl };
  }
);