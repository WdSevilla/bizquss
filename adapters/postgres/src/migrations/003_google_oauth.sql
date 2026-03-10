-- Migración 003: Soporte para Google OAuth (PostgreSQL)

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_id) WHERE google_id IS NOT NULL;
