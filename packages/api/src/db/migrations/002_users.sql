-- Migración 002: Tabla de usuarios (para auth OAuth)

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  github_id   TEXT UNIQUE,
  login       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  email       TEXT,
  is_admin    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- El primer usuario registrado es admin automáticamente (único owner en self-hosted)
CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id);
