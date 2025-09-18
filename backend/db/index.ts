import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("tiktok_platform", {
  migrations: "./migrations",
});
