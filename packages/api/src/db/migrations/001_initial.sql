-- Migración 001: Esquema inicial
-- Compatible con PostgreSQL y SQLite (con pequeñas diferencias en tipos)

CREATE TABLE IF NOT EXISTS sites (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  domain      TEXT NOT NULL UNIQUE,
  owner_id    TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE,
  settings    TEXT DEFAULT '{}',
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS threads (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url_path    TEXT NOT NULL,
  title       TEXT,
  is_locked   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(site_id, url_path)
);

CREATE TABLE IF NOT EXISTS comments (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id     TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id     TEXT REFERENCES comments(id) ON DELETE SET NULL,
  user_id       TEXT,
  author_name   TEXT NOT NULL,
  author_email  TEXT,
  content       TEXT NOT NULL,
  content_html  TEXT,
  status        TEXT DEFAULT 'pending'
                CHECK(status IN ('pending','approved','spam','deleted')),
  ip_hash       TEXT,
  created_at    TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  edited_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_thread  ON comments(thread_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent  ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_threads_site     ON threads(site_id);

CREATE TABLE IF NOT EXISTS reactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id  TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK(type IN ('upvote','heart','laugh')),
  fingerprint TEXT NOT NULL,
  user_id     TEXT,
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(comment_id, type, fingerprint)
);

-- Tabla para tracking de migraciones ejecutadas
CREATE TABLE IF NOT EXISTS _migrations (
  name        TEXT PRIMARY KEY,
  applied_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
