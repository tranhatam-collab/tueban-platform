import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";

export interface NotesEnv {
  DB: D1Database;
}

function nowTs(): number { return Math.floor(Date.now() / 1000); }
function makeId(prefix: string): string { return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`; }
async function readJsonBody<T>(request: Request): Promise<T | null> { try { return (await request.json()) as T; } catch { return null; } }

export async function notesListRoute(
  request: Request,
  env: NotesEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lesson_id");

  let sql = `SELECT n.*, l.title AS lesson_title, l.slug AS lesson_slug
             FROM notes n INNER JOIN lessons l ON l.id = n.lesson_id
             WHERE n.user_id = ?`;
  const vals: unknown[] = [user.user_id];
  if (lessonId) { sql += " AND n.lesson_id = ?"; vals.push(lessonId); }
  sql += " ORDER BY n.updated_at DESC";

  const rows = await env.DB.prepare(sql).bind(...vals).all();
  return json({ ok: true, notes: rows.results ?? [] });
}

export async function notesCreateRoute(
  request: Request,
  env: NotesEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{ lesson_id?: string; content_md?: string }>(request);
  if (!body?.lesson_id || !body?.content_md) {
    return json({ ok: false, error: "Missing lesson_id or content_md" }, 400);
  }

  const timestamp = nowTs();
  const id = makeId("note");

  await env.DB.prepare(
    `INSERT INTO notes (id, user_id, lesson_id, content_md, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, user.user_id, body.lesson_id, body.content_md, timestamp, timestamp).run();

  return json({ ok: true, note: { id, lesson_id: body.lesson_id, content_md: body.content_md, created_at: timestamp } });
}

export async function notesUpdateRoute(
  request: Request,
  env: NotesEnv,
  noteId: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const body = await readJsonBody<{ content_md?: string }>(request);
  if (!body?.content_md) return json({ ok: false, error: "Missing content_md" }, 400);

  const timestamp = nowTs();
  await env.DB.prepare(
    `UPDATE notes SET content_md = ?, updated_at = ? WHERE id = ? AND user_id = ?`
  ).bind(body.content_md, timestamp, noteId, user.user_id).run();

  return json({ ok: true, message: "Note updated" });
}

export async function notesDeleteRoute(
  request: Request,
  env: NotesEnv,
  noteId: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  await env.DB.prepare(
    `DELETE FROM notes WHERE id = ? AND user_id = ?`
  ).bind(noteId, user.user_id).run();

  return json({ ok: true, message: "Note deleted" });
}
