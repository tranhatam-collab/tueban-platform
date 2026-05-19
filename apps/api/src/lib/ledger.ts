export interface LedgerEnv {
  DB: D1Database;
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function appendLedgerEvent(
  env: LedgerEnv,
  event: {
    event_type: string;
    actor_user_id: string | null;
    target_type: string;
    target_id: string;
    payload: Record<string, unknown>;
  }
): Promise<string> {
  const lastEvent = await env.DB.prepare(
    `SELECT current_hash FROM ledger_events ORDER BY created_at DESC LIMIT 1`
  ).first<{ current_hash: string }>();

  const timestamp = Math.floor(Date.now() / 1000);
  const previousHash = lastEvent?.current_hash || null;
  const payloadJson = JSON.stringify(event.payload);
  const hashInput = [previousHash, event.event_type, event.actor_user_id, event.target_type, event.target_id, payloadJson, timestamp].join("|");
  const currentHash = await sha256Hex(hashInput);

  await env.DB.prepare(
    `INSERT INTO ledger_events (id, event_type, actor_user_id, target_type, target_id, payload_json, previous_hash, current_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    makeId("le"),
    event.event_type,
    event.actor_user_id,
    event.target_type,
    event.target_id,
    payloadJson,
    previousHash,
    currentHash,
    timestamp
  ).run();

  return currentHash;
}

export async function verifyLedgerChain(
  env: LedgerEnv
): Promise<{ status: "ok" | "broken"; total_events: number; errors: string[] }> {
  const rows = await env.DB.prepare(
    `SELECT id, event_type, actor_user_id, target_type, target_id, payload_json, previous_hash, current_hash, created_at
     FROM ledger_events ORDER BY created_at ASC`
  ).all<{
    id: string; event_type: string; actor_user_id: string | null;
    target_type: string; target_id: string; payload_json: string;
    previous_hash: string | null; current_hash: string; created_at: number;
  }>();

  const errors: string[] = [];
  let expectedPrev: string | null = null;

  for (const event of rows.results ?? []) {
    if (event.previous_hash !== expectedPrev) {
      errors.push(`Event ${event.id}: expected previous_hash ${expectedPrev}, got ${event.previous_hash}`);
    }
    const hashInput = [event.previous_hash, event.event_type, event.actor_user_id, event.target_type, event.target_id, event.payload_json, event.created_at].join("|");
    const computedHash = await sha256Hex(hashInput);
    if (computedHash !== event.current_hash) {
      errors.push(`Event ${event.id}: hash mismatch. Computed ${computedHash}, stored ${event.current_hash}`);
    }
    expectedPrev = event.current_hash;
  }

  const status = errors.length === 0 ? "ok" : "broken";
  const verificationId = makeId("lv");

  await env.DB.prepare(
    `INSERT INTO ledger_verifications (id, verification_type, status, details_json, verified_at)
     VALUES (?, 'chain_verify', ?, ?, ?)`
  ).bind(verificationId, status, JSON.stringify({ total_events: rows.results?.length || 0, errors }), Math.floor(Date.now() / 1000)).run();

  return { status, total_events: rows.results?.length || 0, errors };
}
