CREATE TABLE IF NOT EXISTS public_proof_records (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  ledger_event_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ledger_event_id) REFERENCES ledger_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_public_proof_public_id ON public_proof_records(public_id);
CREATE INDEX IF NOT EXISTS idx_public_proof_user_id ON public_proof_records(user_id);
