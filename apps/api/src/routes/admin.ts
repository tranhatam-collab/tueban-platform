import { json } from "../lib/json";

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

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ──────────────────────────────────────────
// COURSES
// ──────────────────────────────────────────

async function adminListCourses(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT id, slug, title, short_description, level, visibility, status, created_at, updated_at
       FROM courses
       ORDER BY updated_at DESC`
    ).all();
    return json({ ok: true, courses: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminCreateCourse(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return json({ ok: false, error: "title is required" }, 400);
  }

  const id = makeId("course");
  const ts = nowTs();
  const title = body.title.trim();
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : toSlug(title);

  try {
    await env.DB.prepare(
      `INSERT INTO courses (id, slug, title, short_description, long_description, level, visibility, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?)`
    )
      .bind(
        id,
        slug,
        title,
        typeof body.short_description === "string"
          ? body.short_description.trim() || null
          : null,
        typeof body.long_description === "string"
          ? body.long_description.trim() || null
          : null,
        typeof body.level === "string" ? body.level.trim() || "basic" : "basic",
        typeof body.visibility === "string"
          ? body.visibility.trim() || "members"
          : "members",
        typeof body.status === "string"
          ? body.status.trim() || "draft"
          : "draft",
        ts,
        ts
      )
      .run();

    return json({ ok: true, course: { id, slug } });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminUpdateCourse(
  request: Request,
  env: AdminEnv,
  courseId: string
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return json({ ok: false, error: "Invalid body" }, 400);

  const ts = nowTs();

  try {
    await env.DB.prepare(
      `UPDATE courses SET
         title = COALESCE(?, title),
         short_description = COALESCE(?, short_description),
         long_description = COALESCE(?, long_description),
         level = COALESCE(?, level),
         visibility = COALESCE(?, visibility),
         status = COALESCE(?, status),
         updated_at = ?
       WHERE id = ?`
    )
      .bind(
        typeof body.title === "string" ? body.title.trim() || null : null,
        typeof body.short_description === "string"
          ? body.short_description.trim() || null
          : null,
        typeof body.long_description === "string"
          ? body.long_description.trim() || null
          : null,
        typeof body.level === "string" ? body.level.trim() || null : null,
        typeof body.visibility === "string"
          ? body.visibility.trim() || null
          : null,
        typeof body.status === "string" ? body.status.trim() || null : null,
        ts,
        courseId
      )
      .run();

    return json({ ok: true, course_id: courseId });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// MODULES
// ──────────────────────────────────────────

async function adminListModules(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("course_id");

  try {
    let rows;
    if (courseId) {
      rows = await env.DB.prepare(
        `SELECT m.id, m.course_id, m.title, m.description, m.position, m.created_at, m.updated_at,
                c.title AS course_title
         FROM course_modules m
         INNER JOIN courses c ON c.id = m.course_id
         WHERE m.course_id = ?
         ORDER BY m.position ASC`
      )
        .bind(courseId)
        .all();
    } else {
      rows = await env.DB.prepare(
        `SELECT m.id, m.course_id, m.title, m.description, m.position, m.created_at, m.updated_at,
                c.title AS course_title
         FROM course_modules m
         INNER JOIN courses c ON c.id = m.course_id
         ORDER BY c.title ASC, m.position ASC`
      ).all();
    }

    return json({ ok: true, modules: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminCreateModule(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (
    !body ||
    typeof body.course_id !== "string" ||
    !body.course_id.trim() ||
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return json({ ok: false, error: "course_id and title are required" }, 400);
  }

  const id = makeId("mod");
  const ts = nowTs();
  const position = typeof body.position === "number" ? body.position : 0;

  try {
    await env.DB.prepare(
      `INSERT INTO course_modules (id, course_id, title, description, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.course_id.trim(),
        body.title.trim(),
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
        position,
        ts,
        ts
      )
      .run();

    return json({ ok: true, module: { id, course_id: body.course_id } });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminUpdateModule(
  request: Request,
  env: AdminEnv,
  moduleId: string
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return json({ ok: false, error: "Invalid body" }, 400);

  const ts = nowTs();

  try {
    await env.DB.prepare(
      `UPDATE course_modules SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         position = COALESCE(?, position),
         updated_at = ?
       WHERE id = ?`
    )
      .bind(
        typeof body.title === "string" ? body.title.trim() || null : null,
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
        typeof body.position === "number" ? body.position : null,
        ts,
        moduleId
      )
      .run();

    return json({ ok: true, module_id: moduleId });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// TOPICS
// ──────────────────────────────────────────

async function adminListTopics(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const url = new URL(request.url);
  const moduleId = url.searchParams.get("module_id");

  try {
    let rows;
    if (moduleId) {
      rows = await env.DB.prepare(
        `SELECT t.id, t.module_id, t.slug, t.title, t.description, t.position, t.requires_approval,
                t.created_at, t.updated_at,
                m.title AS module_title, c.title AS course_title
         FROM course_topics t
         INNER JOIN course_modules m ON m.id = t.module_id
         INNER JOIN courses c ON c.id = m.course_id
         WHERE t.module_id = ?
         ORDER BY t.position ASC`
      )
        .bind(moduleId)
        .all();
    } else {
      rows = await env.DB.prepare(
        `SELECT t.id, t.module_id, t.slug, t.title, t.description, t.position, t.requires_approval,
                t.created_at, t.updated_at,
                m.title AS module_title, c.title AS course_title
         FROM course_topics t
         INNER JOIN course_modules m ON m.id = t.module_id
         INNER JOIN courses c ON c.id = m.course_id
         ORDER BY c.title ASC, m.position ASC, t.position ASC`
      ).all();
    }

    return json({ ok: true, topics: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminCreateTopic(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (
    !body ||
    typeof body.module_id !== "string" ||
    !body.module_id.trim() ||
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return json({ ok: false, error: "module_id and title are required" }, 400);
  }

  const id = makeId("topic");
  const ts = nowTs();
  const title = body.title.trim();
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : toSlug(title);
  const position = typeof body.position === "number" ? body.position : 0;

  try {
    await env.DB.prepare(
      `INSERT INTO course_topics (id, module_id, slug, title, description, position, requires_approval, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(
        id,
        body.module_id.trim(),
        slug,
        title,
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
        position,
        ts,
        ts
      )
      .run();

    return json({ ok: true, topic: { id, slug } });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminUpdateTopic(
  request: Request,
  env: AdminEnv,
  topicId: string
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return json({ ok: false, error: "Invalid body" }, 400);

  const ts = nowTs();

  try {
    await env.DB.prepare(
      `UPDATE course_topics SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         position = COALESCE(?, position),
         updated_at = ?
       WHERE id = ?`
    )
      .bind(
        typeof body.title === "string" ? body.title.trim() || null : null,
        typeof body.description === "string"
          ? body.description.trim() || null
          : null,
        typeof body.position === "number" ? body.position : null,
        ts,
        topicId
      )
      .run();

    return json({ ok: true, topic_id: topicId });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// LESSONS
// ──────────────────────────────────────────

async function adminListLessons(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const url = new URL(request.url);
  const topicId = url.searchParams.get("topic_id");

  try {
    let rows;
    if (topicId) {
      rows = await env.DB.prepare(
        `SELECT l.id, l.topic_id, l.slug, l.title, l.lesson_type, l.completion_mode,
                l.position, l.status, l.estimated_minutes, l.created_at, l.updated_at,
                t.title AS topic_title, m.title AS module_title, c.title AS course_title
         FROM lessons l
         INNER JOIN course_topics t ON t.id = l.topic_id
         INNER JOIN course_modules m ON m.id = t.module_id
         INNER JOIN courses c ON c.id = m.course_id
         WHERE l.topic_id = ?
         ORDER BY l.position ASC`
      )
        .bind(topicId)
        .all();
    } else {
      rows = await env.DB.prepare(
        `SELECT l.id, l.topic_id, l.slug, l.title, l.lesson_type, l.completion_mode,
                l.position, l.status, l.estimated_minutes, l.created_at, l.updated_at,
                t.title AS topic_title, m.title AS module_title, c.title AS course_title
         FROM lessons l
         INNER JOIN course_topics t ON t.id = l.topic_id
         INNER JOIN course_modules m ON m.id = t.module_id
         INNER JOIN courses c ON c.id = m.course_id
         ORDER BY c.title ASC, m.position ASC, t.position ASC, l.position ASC`
      ).all();
    }

    return json({ ok: true, lessons: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminCreateLesson(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (
    !body ||
    typeof body.topic_id !== "string" ||
    !body.topic_id.trim() ||
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return json({ ok: false, error: "topic_id and title are required" }, 400);
  }

  const id = makeId("lesson");
  const ts = nowTs();
  const title = body.title.trim();
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : toSlug(title);
  const position = typeof body.position === "number" ? body.position : 0;

  try {
    await env.DB.prepare(
      `INSERT INTO lessons (id, topic_id, slug, title, content_md, lesson_type, completion_mode, estimated_minutes, is_preview, position, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.topic_id.trim(),
        slug,
        title,
        typeof body.content_md === "string"
          ? body.content_md.trim() || null
          : null,
        typeof body.lesson_type === "string"
          ? body.lesson_type.trim() || "text"
          : "text",
        typeof body.completion_mode === "string"
          ? body.completion_mode.trim() || "text_only"
          : "text_only",
        typeof body.estimated_minutes === "number" ? body.estimated_minutes : 0,
        position,
        typeof body.status === "string" ? body.status.trim() || "draft" : "draft",
        ts,
        ts
      )
      .run();

    return json({ ok: true, lesson: { id, slug } });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminUpdateLesson(
  request: Request,
  env: AdminEnv,
  lessonId: string
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (!body) return json({ ok: false, error: "Invalid body" }, 400);

  const ts = nowTs();

  try {
    await env.DB.prepare(
      `UPDATE lessons SET
         title = COALESCE(?, title),
         content_md = COALESCE(?, content_md),
         lesson_type = COALESCE(?, lesson_type),
         completion_mode = COALESCE(?, completion_mode),
         status = COALESCE(?, status),
         position = COALESCE(?, position),
         estimated_minutes = COALESCE(?, estimated_minutes),
         updated_at = ?
       WHERE id = ?`
    )
      .bind(
        typeof body.title === "string" ? body.title.trim() || null : null,
        typeof body.content_md === "string" ? body.content_md.trim() || null : null,
        typeof body.lesson_type === "string"
          ? body.lesson_type.trim() || null
          : null,
        typeof body.completion_mode === "string"
          ? body.completion_mode.trim() || null
          : null,
        typeof body.status === "string" ? body.status.trim() || null : null,
        typeof body.position === "number" ? body.position : null,
        typeof body.estimated_minutes === "number" ? body.estimated_minutes : null,
        ts,
        lessonId
      )
      .run();

    return json({ ok: true, lesson_id: lessonId });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// ASSETS
// ──────────────────────────────────────────

async function adminListAssets(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT id, asset_type, title, storage_path, mime_type, visibility, size_bytes, owner_user_id, created_at
       FROM media_assets
       ORDER BY created_at DESC`
    ).all();
    return json({ ok: true, assets: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

async function adminCreateAsset(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid multipart form data" }, 400);
  }

  const file = formData.get("file") as File | null;
  const title = ((formData.get("title") as string) || "").trim();
  const assetType = ((formData.get("asset_type") as string) || "attachment").trim();
  const visibility = ((formData.get("visibility") as string) || "protected").trim();

  if (!file || !title) {
    return json({ ok: false, error: "file and title are required" }, 400);
  }

  const id = makeId("asset");
  const ts = nowTs();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const storageKey = `uploads/${ts}-${id}${ext ? "." + ext : ""}`;

  try {
    await env.MEDIA.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" }
    });

    await env.DB.prepare(
      `INSERT INTO media_assets (id, asset_type, title, storage_path, mime_type, visibility, size_bytes, owner_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user_admin_001', ?)`
    )
      .bind(id, assetType, title, storageKey, file.type || null, visibility, file.size, ts)
      .run();

    return json({ ok: true, asset: { id, storage_path: storageKey } });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// LESSON ASSETS (attach)
// ──────────────────────────────────────────

async function adminCreateLessonAsset(
  request: Request,
  env: AdminEnv
): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (
    !body ||
    typeof body.lesson_id !== "string" ||
    !body.lesson_id.trim() ||
    typeof body.asset_id !== "string" ||
    !body.asset_id.trim()
  ) {
    return json({ ok: false, error: "lesson_id and asset_id are required" }, 400);
  }

  const id = makeId("la");
  const ts = nowTs();

  try {
    await env.DB.prepare(
      `INSERT INTO lesson_assets (id, lesson_id, asset_id, purpose, position, is_required, downloadable, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.lesson_id.trim(),
        body.asset_id.trim(),
        typeof body.purpose === "string" ? body.purpose.trim() || "attachment" : "attachment",
        typeof body.position === "number" ? body.position : 1,
        body.is_required ? 1 : 0,
        body.downloadable !== false ? 1 : 0,
        ts
      )
      .run();

    return json({ ok: true, lesson_asset_id: id });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// USERS
// ──────────────────────────────────────────

async function adminListUsers(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.full_name, u.status, u.created_at, u.updated_at,
              GROUP_CONCAT(r.code) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    ).all();

    return json({ ok: true, users: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// PROGRESS
// ──────────────────────────────────────────

async function adminListProgress(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT ulp.id, ulp.user_id, ulp.status, ulp.completed_at, ulp.updated_at,
              u.email AS user_email,
              l.slug AS lesson_slug, l.title AS lesson_title,
              c.slug AS course_slug, c.title AS course_title
       FROM user_lesson_progress ulp
       INNER JOIN users u ON u.id = ulp.user_id
       INNER JOIN lessons l ON l.id = ulp.lesson_id
       INNER JOIN course_topics t ON t.id = l.topic_id
       INNER JOIN course_modules m ON m.id = t.module_id
       INNER JOIN courses c ON c.id = m.course_id
       ORDER BY ulp.updated_at DESC
       LIMIT 100`
    ).all();

    return json({ ok: true, progresses: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// AUDIT
// ──────────────────────────────────────────

async function adminListAudit(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT al.id, al.actor_user_id, al.action_type, al.target_type, al.target_id,
              al.details_json, al.created_at,
              u.email AS actor_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       ORDER BY al.created_at DESC
       LIMIT 100`
    ).all();

    return json({ ok: true, audit_logs: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// LEDGER
// ──────────────────────────────────────────

async function adminListLedger(env: AdminEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `SELECT le.id, le.event_type, le.actor_user_id, le.target_type, le.target_id,
              le.payload_json, le.created_at,
              u.email AS actor_email
       FROM ledger_events le
       LEFT JOIN users u ON u.id = le.actor_user_id
       ORDER BY le.created_at DESC
       LIMIT 100`
    ).all();

    return json({ ok: true, ledger_events: rows.results ?? [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

// ──────────────────────────────────────────
// MAIN DISPATCHER
// ──────────────────────────────────────────

export async function adminRoute(
  request: Request,
  env: AdminEnv,
  segments: string[]
): Promise<Response> {
  const method = request.method.toUpperCase();
  // segments: ['api', 'admin', resource, id?]
  const resource = segments[2];
  const resourceId = segments[3];

  if (resource === "courses") {
    if (method === "GET" && !resourceId) return adminListCourses(env);
    if (method === "POST" && !resourceId) return adminCreateCourse(request, env);
    if (method === "PATCH" && resourceId)
      return adminUpdateCourse(request, env, resourceId);
  }

  if (resource === "modules") {
    if (method === "GET" && !resourceId) return adminListModules(request, env);
    if (method === "POST" && !resourceId) return adminCreateModule(request, env);
    if (method === "PATCH" && resourceId)
      return adminUpdateModule(request, env, resourceId);
  }

  if (resource === "topics") {
    if (method === "GET" && !resourceId) return adminListTopics(request, env);
    if (method === "POST" && !resourceId) return adminCreateTopic(request, env);
    if (method === "PATCH" && resourceId)
      return adminUpdateTopic(request, env, resourceId);
  }

  if (resource === "lessons") {
    if (method === "GET" && !resourceId) return adminListLessons(request, env);
    if (method === "POST" && !resourceId) return adminCreateLesson(request, env);
    if (method === "PATCH" && resourceId)
      return adminUpdateLesson(request, env, resourceId);
  }

  if (resource === "assets") {
    if (method === "GET" && !resourceId) return adminListAssets(env);
    if (method === "POST" && !resourceId) return adminCreateAsset(request, env);
  }

  if (resource === "lesson-assets") {
    if (method === "POST" && !resourceId) return adminCreateLessonAsset(request, env);
  }

  if (resource === "users" && method === "GET") return adminListUsers(env);
  if (resource === "progress" && method === "GET")
    return adminListProgress(env);
  if (resource === "audit" && method === "GET") return adminListAudit(env);
  if (resource === "ledger" && method === "GET") return adminListLedger(env);

  return json(
    { ok: false, error: "Admin route not found", resource, method },
    404
  );
}
