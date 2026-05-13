CREATE TABLE IF NOT EXISTS auth_magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_links_email ON auth_magic_links(email);
CREATE INDEX IF NOT EXISTS idx_auth_magic_links_expires_at ON auth_magic_links(expires_at);
