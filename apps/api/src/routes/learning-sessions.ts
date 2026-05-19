import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";

export interface LearningSessionsEnv {
  DB: D1Database;
}

function nowTs(): number { return Math.floor(Date.now() / 1000); }
function makeId(prefix: string): string { return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`; }
async function readJsonBody<T>(request: Request): Promise<T | null> { try { return (await request.json()) as T; } catch { return null; } }

export async function sessionStartRoute(
  request: Request,
  env: LearningSessionsEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{ lesson_slug?: string; source?: string }>(request);
  if (!body?.lesson_slug) return json({ ok: false, error: "Missing lesson_slug" }, 400);

  const lesson = await env.DB.prepare(
    `SELECT id FROM lessons WHERE slug = ? LIMIT 1`
  )
    .bind(body.lesson_slug)
    .first<{ id: string }>();

  if (!lesson) return json({ ok: false, error: "Lesson not found" }, 404);

  const timestamp = nowTs();
  const id = makeId("uls");

  await env.DB.prepare(
    `INSERT INTO user_learning_sessions (id, user_id, lesson_id, started_at, source)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, user.user_id, lesson.id, timestamp, body.source || "web").run();

  return json({ ok: true, session: { id, lesson_id: lesson.id, started_at: timestamp } });
}

export async function sessionPingRoute(
  request: Request,
  env: LearningSessionsEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{ session_id?: string; active_seconds?: number }>(request);
  if (!body?.session_id) return json({ ok: false, error: "Missing session_id" }, 400);

  const session = await env.DB.prepare(
    `SELECT id, user_id, ended_at FROM user_learning_sessions WHERE id = ? LIMIT 1`
  )
    .bind(body.session_id)
    .first<{ id: string; user_id: string; ended_at: number | null }>();

  if (!session || session.user_id !== user.user_id) return json({ ok: false, error: "Session not found" }, 404);
  if (session.ended_at) return json({ ok: false, error: "Session ended" }, 400);

  const activeSeconds = body.active_seconds || 30;
  await env.DB.prepare(
    `UPDATE user_learning_sessions SET active_seconds = active_seconds + ? WHERE id = ?`
  ).bind(activeSeconds, body.session_id).run();

  return json({ ok: true, message: "Ping acknowledged" });
}

export async function sessionEndRoute(
  request: Request,
  env: LearningSessionsEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{ session_id?: string }>(request);
  if (!body?.session_id) return json({ ok: false, error: "Missing session_id" }, 400);

  const timestamp = nowTs();
  await env.DB.prepare(
    `UPDATE user_learning_sessions SET ended_at = ? WHERE id = ? AND user_id = ? AND ended_at IS NULL`
  ).bind(timestamp, body.session_id, user.user_id).run();

  return json({ ok: true, message: "Session ended", ended_at: timestamp });
}
