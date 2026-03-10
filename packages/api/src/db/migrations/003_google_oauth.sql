-- Migración 003: Soporte para Google OAuth

ALTER TABLE users ADD COLUMN google_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_id) WHERE google_id IS NOT NULL;
