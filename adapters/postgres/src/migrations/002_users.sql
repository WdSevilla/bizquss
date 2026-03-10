-- Migración 002: Tabla de usuarios (para auth OAuth) — PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT lower(encode(gen_random_bytes(16), 'hex')),
  github_id   TEXT UNIQUE,
  login       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  email       TEXT,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- El primer usuario registrado es admin automáticamente (único owner en self-hosted)
CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id);
