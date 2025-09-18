CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tiktok_accounts (
  account_id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tiktok_user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  preferences JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  last_retry TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE videos (
  id BIGSERIAL PRIMARY KEY,
  account_id VARCHAR(255) NOT NULL REFERENCES tiktok_accounts(account_id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_path TEXT,
  url TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  tiktok_video_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  account_id VARCHAR(255) NOT NULL REFERENCES tiktok_accounts(account_id) ON DELETE CASCADE,
  video_id BIGINT REFERENCES videos(id) ON DELETE CASCADE,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  engagement_rate DOUBLE PRECISION DEFAULT 0,
  follower_count BIGINT DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, video_id, date)
);

CREATE TABLE api_keys (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '["read", "write"]',
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tiktok_accounts_user_id ON tiktok_accounts(user_id);
CREATE INDEX idx_videos_account_id ON videos(account_id);
CREATE INDEX idx_videos_scheduled_time ON videos(scheduled_time);
CREATE INDEX idx_analytics_account_id ON analytics(account_id);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
