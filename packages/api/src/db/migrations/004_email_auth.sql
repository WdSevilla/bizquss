-- Migración 004: Soporte para autenticación por email/contraseña

ALTER TABLE users ADD COLUMN password_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
