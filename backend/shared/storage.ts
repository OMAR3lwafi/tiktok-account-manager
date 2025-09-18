import { Bucket } from "encore.dev/storage/objects";

export const videoBucket = new Bucket("tiktok-videos", {
  public: false,
  versioned: false,
});
