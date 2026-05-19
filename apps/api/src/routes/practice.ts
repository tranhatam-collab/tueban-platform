import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";

export interface PracticeEnv {
  DB: D1Database;
}

function nowTs(): number { return Math.floor(Date.now() / 1000); }
function makeId(prefix: string): string { return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`; }
async function readJsonBody<T>(request: Request): Promise<T | null> { try { return (await request.json()) as T; } catch { return null; } }

export async function practiceListRoute(
  request: Request,
  env: PracticeEnv,
  topicSlug: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const topic = await env.DB.prepare(
    `SELECT id FROM course_topics WHERE slug = ? LIMIT 1`
  )
    .bind(topicSlug)
    .first<{ id: string }>();

  if (!topic) return json({ ok: false, error: "Topic not found" }, 404);

  const tasks = await env.DB.prepare(
    `SELECT id, title, instructions_md, required FROM practice_tasks WHERE topic_id = ? ORDER BY created_at ASC`
  )
    .bind(topic.id)
    .all();

  return json({ ok: true, topic_slug: topicSlug, tasks: tasks.results ?? [] });
}

export async function practiceSubmitRoute(
  request: Request,
  env: PracticeEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{
    task_id?: string; submission_text_md?: string; submission_asset_id?: string;
  }>(request);

  if (!body?.task_id || !body?.submission_text_md) {
    return json({ ok: false, error: "Missing task_id or submission_text_md" }, 400);
  }

  const timestamp = nowTs();
  const id = makeId("ps");

  await env.DB.prepare(
    `INSERT INTO practice_submissions (id, task_id, user_id, submission_text_md, submission_asset_id, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, 'submitted', ?)`
  ).bind(id, body.task_id, user.user_id, body.submission_text_md, body.submission_asset_id || null, timestamp).run();

  await env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, action_type, target_type, target_id, details_json, created_at)
     VALUES (?, ?, 'practice_submit', 'practice_task', ?, ?, ?)`
  ).bind(makeId("al"), user.user_id, body.task_id, JSON.stringify({ task_id: body.task_id }), timestamp).run();

  return json({ ok: true, submission: { id, task_id: body.task_id, status: "submitted", submitted_at: timestamp } });
}

export async function practiceMeRoute(
  request: Request,
  env: PracticeEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const submissions = await env.DB.prepare(
    `SELECT ps.*, pt.title AS task_title FROM practice_submissions ps
     INNER JOIN practice_tasks pt ON pt.id = ps.task_id
     WHERE ps.user_id = ? ORDER BY ps.submitted_at DESC`
  )
    .bind(user.user_id)
    .all();

  return json({ ok: true, submissions: submissions.results ?? [] });
}
