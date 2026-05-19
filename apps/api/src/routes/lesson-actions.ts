import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";
import { evaluateUnlock } from "../lib/unlock";
import { appendLedgerEvent } from "../lib/ledger";

export interface LessonActionsEnv {
  DB: D1Database;
}

type LessonLookupRow = {
  lesson_id: string;
  lesson_slug: string;
  lesson_title: string;
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  course_id: string;
  course_slug: string;
  course_title: string;
};

type CompleteLessonInput = {
  lesson_slug?: string;
};

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

export async function completeLessonRoute(
  request: Request,
  env: LessonActionsEnv
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  const body = await readJsonBody<CompleteLessonInput>(request);
  const lessonSlug = body?.lesson_slug?.trim();

  if (!lessonSlug) {
    return json(
      { ok: false, error: "Missing lesson_slug" },
      400
    );
  }

  try {
    const lesson = await env.DB.prepare(
      `
      SELECT
        l.id AS lesson_id,
        l.slug AS lesson_slug,
        l.title AS lesson_title,
        t.id AS topic_id,
        t.slug AS topic_slug,
        t.title AS topic_title,
        c.id AS course_id,
        c.slug AS course_slug,
        c.title AS course_title
      FROM lessons l
      INNER JOIN course_topics t ON t.id = l.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      INNER JOIN courses c ON c.id = m.course_id
      WHERE l.slug = ?
      LIMIT 1
      `
    )
      .bind(lessonSlug)
      .first<LessonLookupRow>();

    if (!lesson) {
      return json(
        { ok: false, error: "Lesson not found", lesson_slug: lessonSlug },
        404
      );
    }

    const unlockResult = await evaluateUnlock(env, user.user_id, lesson.lesson_id);
    if (!unlockResult.unlocked) {
      return json(
        { ok: false, error: "LESSON_LOCKED", missing: unlockResult.missing },
        403
      );
    }

    const timestamp = nowTs();

    await appendLedgerEvent(env, {
      event_type: "lesson_complete",
      actor_user_id: user.user_id,
      target_type: "lesson",
      target_id: lesson.lesson_id,
      payload: {
        lesson_slug: lesson.lesson_slug,
        topic_slug: lesson.topic_slug,
        course_slug: lesson.course_slug,
        status: "completed"
      }
    });

    const totalLessons = await env.DB.prepare(
      `
      SELECT COUNT(*) AS count FROM lessons l
      INNER JOIN course_topics t ON t.id = l.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE m.course_id = ?
      `
    )
      .bind(lesson.course_id)
      .first<{ count: number }>();

    const completedLessons = await env.DB.prepare(
      `
      SELECT COUNT(*) AS count FROM user_lesson_progress ulp
      INNER JOIN lessons l ON l.id = ulp.lesson_id
      INNER JOIN course_topics t ON t.id = l.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE ulp.user_id = ? AND m.course_id = ? AND ulp.status = 'completed'
      `
    )
      .bind(user.user_id, lesson.course_id)
      .first<{ count: number }>();

    const total = totalLessons?.count || 1;
    const completed = (completedLessons?.count || 0) + 1;
    const progressPercent = Math.round((completed / total) * 100);

    await env.DB.batch([
      env.DB.prepare(
        `
        INSERT INTO user_lesson_progress (
          id, user_id, lesson_id, status, active_learning_seconds,
          video_watch_seconds, reading_estimate_seconds, opened_at, completed_at, updated_at
        )
        VALUES (?, ?, ?, 'completed', 0, 0, 0, ?, ?, ?)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET
          status = 'completed',
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("ulp"),
        user.user_id,
        lesson.lesson_id,
        timestamp,
        timestamp,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO user_topic_progress (
          id, user_id, topic_id, status, started_at, completed_at,
          approved_at, approved_by, updated_at
        )
        VALUES (?, ?, ?, 'completed', ?, ?, NULL, NULL, ?)
        ON CONFLICT(user_id, topic_id) DO UPDATE SET
          status = 'completed',
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("utp"),
        user.user_id,
        lesson.topic_id,
        timestamp,
        timestamp,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO user_course_progress (
          id, user_id, course_id, status, progress_percent,
          started_at, completed_at, updated_at
        )
        VALUES (?, ?, ?, 'in_progress', ?, ?, NULL, ?)
        ON CONFLICT(user_id, course_id) DO UPDATE SET
          status = 'in_progress',
          progress_percent = CASE
            WHEN ? > user_course_progress.progress_percent THEN ?
            ELSE user_course_progress.progress_percent
          END,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("ucp"),
        user.user_id,
        lesson.course_id,
        progressPercent,
        timestamp,
        timestamp,
        progressPercent,
        progressPercent
      ),

      env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, actor_user_id, action_type, target_type, target_id, details_json, created_at
        )
        VALUES (?, ?, 'lesson_complete', 'lesson', ?, ?, ?)
        `
      ).bind(
        makeId("al"),
        user.user_id,
        lesson.lesson_id,
        JSON.stringify({
          lesson_slug: lesson.lesson_slug,
          topic_slug: lesson.topic_slug,
          course_slug: lesson.course_slug
        }),
        timestamp
      )
    ]);

    return json({
      ok: true,
      message: "Lesson marked as completed",
      user_id: user.user_id,
      lesson: {
        id: lesson.lesson_id,
        slug: lesson.lesson_slug,
        title: lesson.lesson_title
      },
      topic: {
        id: lesson.topic_id,
        slug: lesson.topic_slug,
        title: lesson.topic_title
      },
      course: {
        id: lesson.course_id,
        slug: lesson.course_slug,
        title: lesson.course_title
      },
      completed_at: timestamp
    });
  } catch (error) {
    return json(
      { ok: false, error: String(error), lesson_slug: lessonSlug, user_id: user.user_id },
      500
    );
  }
}
