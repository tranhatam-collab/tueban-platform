import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";
import { evaluateUnlock } from "../lib/unlock";

export interface LessonsUnlockEnv {
  DB: D1Database;
}

export async function unlockStatusRoute(
  request: Request,
  env: LessonsUnlockEnv,
  lessonSlug: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  const lesson = await env.DB.prepare(
    `SELECT id, title FROM lessons WHERE slug = ? LIMIT 1`
  )
    .bind(lessonSlug)
    .first<{ id: string; title: string }>();

  if (!lesson) {
    return json({ ok: false, error: "Lesson not found" }, 404);
  }

  const result = await evaluateUnlock(env, user.user_id, lesson.id);

  return json({
    ok: true,
    lesson: { id: lesson.id, slug: lessonSlug, title: lesson.title },
    unlocked: result.unlocked,
    missing: result.missing
  });
}
