import { json } from "../lib/json";

export interface ProofEnv {
  DB: D1Database;
}

export async function publicProofRoute(
  request: Request,
  env: ProofEnv,
  publicId: string
): Promise<Response> {
  const proof = await env.DB.prepare(
    `SELECT ppr.*, u.email, u.full_name,
            le.event_type AS ledger_event_type,
            le.current_hash AS ledger_hash,
            le.previous_hash AS ledger_previous_hash,
            le.created_at AS ledger_created_at
     FROM public_proof_records ppr
     INNER JOIN users u ON u.id = ppr.user_id
     LEFT JOIN ledger_events le ON le.id = ppr.ledger_event_id
     WHERE ppr.public_id = ?
     LIMIT 1`
  )
    .bind(publicId)
    .first();

  if (!proof) {
    return json({ ok: false, error: "Proof not found" }, 404);
  }

  return json({ ok: true, proof });
}
