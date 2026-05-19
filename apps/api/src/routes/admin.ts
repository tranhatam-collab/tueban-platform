import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";
import { requireAdmin } from "../lib/rbac";
import { verifyLedgerChain } from "../lib/ledger";

export interface AdminEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
}

function nowTs(): number {
  return Math.floor(Date.now() / 1000);
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function audit(env: AdminEnv, userId: string, action: string, targetType: string, targetId: string, details: Record<string, unknown>): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, action_type, target_type, target_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(makeId("al"), userId, action, targetType, targetId, JSON.stringify(details), nowTs()).run();
}

// ========== Courses ==========

export async function adminListCourses(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(
    `SELECT * FROM courses ORDER BY updated_at DESC`
  ).all();
  return json({ ok: true, courses: rows.results ?? [] });
}

export async function adminCreateCourse(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{
    slug?: string; title?: string; short_description?: string;
    long_description?: string; level?: string; visibility?: string; status?: string;
  }>(request);
  if (!body?.slug || !body?.title) {
    return json({ ok: false, error: "Missing slug or title" }, 400);
  }
  const timestamp = nowTs();
  const id = makeId("course");
  await env.DB.prepare(
    `INSERT INTO courses (id, slug, title, short_description, long_description, level, visibility, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.slug, body.title, body.short_description || null, body.long_description || null,
    body.level || "basic", body.visibility || "members", body.status || "draft", timestamp, timestamp).run();
  await audit(env, user.user_id, "admin_course_create", "course", id, { slug: body.slug, title: body.title });
  return json({ ok: true, course: { id, slug: body.slug, title: body.title } });
}

export async function adminUpdateCourse(request: Request, env: AdminEnv, courseId: string): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return json({ ok: false, error: "Invalid body" }, 400);
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const key of ["title", "slug", "short_description", "long_description", "level", "visibility", "status"]) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  if (!sets.length) return json({ ok: false, error: "No fields to update" }, 400);
  sets.push("updated_at = ?");
  vals.push(nowTs());
  vals.push(courseId);
  const sql = `UPDATE courses SET ${sets.join(", ")} WHERE id = ?`;
  await env.DB.prepare(sql).bind(...vals).run();
  await audit(env, user.user_id, "admin_course_update", "course", courseId, body as Record<string, unknown>);
  return json({ ok: true, message: "Course updated" });
}

// ========== Modules ==========

export async function adminListModules(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM course_modules ORDER BY course_id, position ASC`).all();
  return json({ ok: true, modules: rows.results ?? [] });
}

export async function adminCreateModule(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{ course_id?: string; title?: string; description?: string; position?: number }>(request);
  if (!body?.course_id || !body?.title) return json({ ok: false, error: "Missing course_id or title" }, 400);
  const timestamp = nowTs();
  const id = makeId("mod");
  const pos = body.position ?? 1;
  await env.DB.prepare(
    `INSERT INTO course_modules (id, course_id, title, description, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.course_id, body.title, body.description || null, pos, timestamp, timestamp).run();
  await audit(env, user.user_id, "admin_module_create", "course_module", id, { course_id: body.course_id, title: body.title });
  return json({ ok: true, module: { id, course_id: body.course_id, title: body.title } });
}

// ========== Topics ==========

export async function adminListTopics(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM course_topics ORDER BY module_id, position ASC`).all();
  return json({ ok: true, topics: rows.results ?? [] });
}

export async function adminCreateTopic(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{ module_id?: string; slug?: string; title?: string; description?: string; position?: number }>(request);
  if (!body?.module_id || !body?.slug || !body?.title) return json({ ok: false, error: "Missing module_id, slug or title" }, 400);
  const timestamp = nowTs();
  const id = makeId("topic");
  const pos = body.position ?? 1;
  await env.DB.prepare(
    `INSERT INTO course_topics (id, module_id, slug, title, description, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.module_id, body.slug, body.title, body.description || null, pos, timestamp, timestamp).run();
  await audit(env, user.user_id, "admin_topic_create", "course_topic", id, { module_id: body.module_id, title: body.title });
  return json({ ok: true, topic: { id, module_id: body.module_id, slug: body.slug, title: body.title } });
}

// ========== Lessons ==========

export async function adminListLessons(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM lessons ORDER BY topic_id, position ASC`).all();
  return json({ ok: true, lessons: rows.results ?? [] });
}

export async function adminCreateLesson(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{
    topic_id?: string; slug?: string; title?: string; lesson_type?: string;
    content_md?: string; estimated_minutes?: number; completion_mode?: string;
    is_preview?: number; position?: number; status?: string;
  }>(request);
  if (!body?.topic_id || !body?.slug || !body?.title) return json({ ok: false, error: "Missing topic_id, slug or title" }, 400);
  const timestamp = nowTs();
  const id = makeId("lesson");
  await env.DB.prepare(
    `INSERT INTO lessons (id, topic_id, slug, title, lesson_type, content_md, estimated_minutes, completion_mode, is_preview, position, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.topic_id, body.slug, body.title, body.lesson_type || "text",
    body.content_md || null, body.estimated_minutes || 0, body.completion_mode || "text_only",
    body.is_preview ?? 0, body.position ?? 1, body.status || "draft", timestamp, timestamp).run();
  await audit(env, user.user_id, "admin_lesson_create", "lesson", id, { topic_id: body.topic_id, title: body.title });
  return json({ ok: true, lesson: { id, topic_id: body.topic_id, slug: body.slug, title: body.title } });
}

// ========== Assets ==========

export async function adminListAssets(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM media_assets ORDER BY created_at DESC`).all();
  return json({ ok: true, assets: rows.results ?? [] });
}

export async function adminRegisterAsset(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{
    storage_path?: string; asset_type?: string; title?: string;
    mime_type?: string; visibility?: string; size_bytes?: number;
  }>(request);
  if (!body?.storage_path || !body?.title) return json({ ok: false, error: "Missing storage_path or title" }, 400);
  const timestamp = nowTs();
  const id = makeId("asset");
  await env.DB.prepare(
    `INSERT INTO media_assets (id, asset_type, title, storage_path, mime_type, visibility, size_bytes, owner_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.asset_type || "document", body.title, body.storage_path,
    body.mime_type || null, body.visibility || "protected", body.size_bytes || 0,
    user.user_id, timestamp).run();
  await audit(env, user.user_id, "admin_asset_register", "media_asset", id, { storage_path: body.storage_path });
  return json({ ok: true, asset: { id, storage_path: body.storage_path, title: body.title } });
}

export async function adminGetUploadUrl(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{ filename?: string }>(request);
  const filename = body?.filename || `upload_${Date.now()}`;
  const key = `uploads/${makeId("f")}/${filename}`;
  const url = await env.MEDIA.createPresignedUrl(key, {
    method: "PUT",
    expiresIn: 3600,
  });
  return json({ ok: true, upload_url: url, key });
}

// ========== Users ==========

export async function adminListUsers(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(
    `SELECT u.id, u.email, u.full_name, u.status, u.created_at, u.updated_at,
            COALESCE(json_group_array(DISTINCT r.code), '[]') AS roles_json
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  ).all();
  return json({ ok: true, users: rows.results ?? [] });
}

// ========== Progress ==========

export async function adminListProgress(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const url = new URL(request.url);
  const courseId = url.searchParams.get("course_id");
  const userId = url.searchParams.get("user_id");
  let sql = `SELECT ucp.*, u.email, u.full_name FROM user_course_progress ucp INNER JOIN users u ON u.id = ucp.user_id`;
  const vals: unknown[] = [];
  const wheres: string[] = [];
  if (courseId) { wheres.push("ucp.course_id = ?"); vals.push(courseId); }
  if (userId) { wheres.push("ucp.user_id = ?"); vals.push(userId); }
  if (wheres.length) sql += " WHERE " + wheres.join(" AND ");
  sql += " ORDER BY ucp.updated_at DESC";
  const rows = await env.DB.prepare(sql).bind(...vals).all();
  return json({ ok: true, progress: rows.results ?? [] });
}

// ========== Audit ==========

export async function adminListAudit(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const url = new URL(request.url);
  const actionType = url.searchParams.get("action_type");
  const actorId = url.searchParams.get("actor_user_id");
  let sql = `SELECT al.*, u.email AS actor_email FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_user_id`;
  const vals: unknown[] = [];
  const wheres: string[] = [];
  if (actionType) { wheres.push("al.action_type = ?"); vals.push(actionType); }
  if (actorId) { wheres.push("al.actor_user_id = ?"); vals.push(actorId); }
  if (wheres.length) sql += " WHERE " + wheres.join(" AND ");
  sql += " ORDER BY al.created_at DESC LIMIT 200";
  const rows = await env.DB.prepare(sql).bind(...vals).all();
  return json({ ok: true, audit_logs: rows.results ?? [] });
}

// ========== Ledger ==========

export async function adminListLedger(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM ledger_events ORDER BY created_at DESC LIMIT 200`).all();
  return json({ ok: true, ledger_events: rows.results ?? [] });
}

export async function adminVerifyLedger(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const result = await verifyLedgerChain(env);
  return json({ ok: true, verification: result });
}

// ========== Events ==========

export async function adminListEvents(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const rows = await env.DB.prepare(`SELECT * FROM events ORDER BY starts_at DESC`).all();
  return json({ ok: true, events: rows.results ?? [] });
}

export async function adminCreateEvent(request: Request, env: AdminEnv): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);
  requireAdmin(user);
  const body = await readJsonBody<{
    slug?: string; title?: string; event_type?: string; description_md?: string;
    starts_at?: number; ends_at?: number; location_text?: string; status?: string;
  }>(request);
  if (!body?.slug || !body?.title || !body?.starts_at) {
    return json({ ok: false, error: "Missing slug, title or starts_at" }, 400);
  }
  const timestamp = nowTs();
  const id = makeId("evt");
  await env.DB.prepare(
    `INSERT INTO events (id, slug, title, event_type, description_md, starts_at, ends_at, location_text, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.slug, body.title, body.event_type || "live", body.description_md || null,
    body.starts_at, body.ends_at || null, body.location_text || null, body.status || "draft", timestamp, timestamp).run();
  await audit(env, user.user_id, "admin_event_create", "event", id, { slug: body.slug, title: body.title });
  return json({ ok: true, event: { id, slug: body.slug, title: body.title } });
}

// ========== Route dispatcher ==========

function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function adminRoute(request: Request, env: AdminEnv): Promise<Response> | null {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // Courses
  if (method === "GET" && pathname === "/api/admin/courses") return adminListCourses(request, env);
  if (method === "POST" && pathname === "/api/admin/courses") return adminCreateCourse(request, env);
  const courseUpdateMatch = matchPath(pathname, "api/admin/courses/:id");
  if (method === "PATCH" && courseUpdateMatch) return adminUpdateCourse(request, env, courseUpdateMatch.id);

  // Modules
  if (method === "GET" && pathname === "/api/admin/modules") return adminListModules(request, env);
  if (method === "POST" && pathname === "/api/admin/modules") return adminCreateModule(request, env);

  // Topics
  if (method === "GET" && pathname === "/api/admin/topics") return adminListTopics(request, env);
  if (method === "POST" && pathname === "/api/admin/topics") return adminCreateTopic(request, env);

  // Lessons
  if (method === "GET" && pathname === "/api/admin/lessons") return adminListLessons(request, env);
  if (method === "POST" && pathname === "/api/admin/lessons") return adminCreateLesson(request, env);

  // Assets
  if (method === "GET" && pathname === "/api/admin/assets") return adminListAssets(request, env);
  if (method === "POST" && pathname === "/api/admin/assets/register") return adminRegisterAsset(request, env);
  if (method === "POST" && pathname === "/api/admin/assets/upload-url") return adminGetUploadUrl(request, env);

  // Users
  if (method === "GET" && pathname === "/api/admin/users") return adminListUsers(request, env);

  // Progress
  if (method === "GET" && pathname === "/api/admin/progress") return adminListProgress(request, env);

  // Audit
  if (method === "GET" && pathname === "/api/admin/audit") return adminListAudit(request, env);

  // Ledger
  if (method === "GET" && pathname === "/api/admin/ledger") return adminListLedger(request, env);
  if (method === "POST" && pathname === "/api/admin/ledger/verify") return adminVerifyLedger(request, env);

  // Events
  if (method === "GET" && pathname === "/api/admin/events") return adminListEvents(request, env);
  if (method === "POST" && pathname === "/api/admin/events") return adminCreateEvent(request, env);

  return null;
}
