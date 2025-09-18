import { api } from "encore.dev/api";

interface TikTokWebhookEvent {
  event_type?: string;
  timestamp?: number;
  data?: any;
}

export const webhook = api(
  { method: "POST", path: "/webhooks/tiktok", expose: true },
  async (req: TikTokWebhookEvent): Promise<{ success: boolean }> => {
    console.log("TikTok webhook received:", req);
    
    // Handle different webhook event types
    if (req.event_type) {
      switch (req.event_type) {
        case "video_publish":
          console.log("Video published:", req.data);
          break;
        case "video_delete":
          console.log("Video deleted:", req.data);
          break;
        default:
          console.log("Unknown webhook event:", req.event_type);
      }
    }
    
    return { success: true };
  }
);