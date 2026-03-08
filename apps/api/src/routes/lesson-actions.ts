import { json } from "../lib/json";

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
  user_id?: string;
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
  const body = await readJsonBody<CompleteLessonInput>(request);

  const userId = body?.user_id?.trim();
  const lessonSlug = body?.lesson_slug?.trim();

  if (!userId || !lessonSlug) {
    return json(
      {
        ok: false,
        error: "Missing user_id or lesson_slug"
      },
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
        {
          ok: false,
          error: "Lesson not found",
          lesson_slug: lessonSlug
        },
        404
      );
    }

    const timestamp = nowTs();

    await env.DB.batch([
      env.DB.prepare(
        `
        INSERT INTO user_lesson_progress (
          id,
          user_id,
          lesson_id,
          status,
          active_learning_seconds,
          video_watch_seconds,
          reading_estimate_seconds,
          opened_at,
          completed_at,
          updated_at
        )
        VALUES (?, ?, ?, 'completed', 0, 0, 0, ?, ?, ?)
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET
          status = 'completed',
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("ulp"),
        userId,
        lesson.lesson_id,
        timestamp,
        timestamp,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO user_topic_progress (
          id,
          user_id,
          topic_id,
          status,
          started_at,
          completed_at,
          approved_at,
          approved_by,
          updated_at
        )
        VALUES (?, ?, ?, 'completed', ?, ?, NULL, NULL, ?)
        ON CONFLICT(user_id, topic_id) DO UPDATE SET
          status = 'completed',
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("utp"),
        userId,
        lesson.topic_id,
        timestamp,
        timestamp,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO user_course_progress (
          id,
          user_id,
          course_id,
          status,
          progress_percent,
          started_at,
          completed_at,
          updated_at
        )
        VALUES (?, ?, ?, 'in_progress', 100, ?, NULL, ?)
        ON CONFLICT(user_id, course_id) DO UPDATE SET
          status = 'in_progress',
          progress_percent = CASE
            WHEN user_course_progress.progress_percent < 100 THEN 100
            ELSE user_course_progress.progress_percent
          END,
          updated_at = excluded.updated_at
        `
      ).bind(
        makeId("ucp"),
        userId,
        lesson.course_id,
        timestamp,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO ledger_events (
          id,
          event_type,
          actor_user_id,
          target_type,
          target_id,
          payload_json,
          previous_hash,
          current_hash,
          created_at
        )
        VALUES (?, 'lesson_complete', ?, 'lesson', ?, ?, NULL, ?, ?)
        `
      ).bind(
        makeId("le"),
        userId,
        lesson.lesson_id,
        JSON.stringify({
          lesson_slug: lesson.lesson_slug,
          topic_slug: lesson.topic_slug,
          course_slug: lesson.course_slug,
          status: "completed"
        }),
        `hash_${crypto.randomUUID().replace(/-/g, "")}`,
        timestamp
      ),

      env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id,
          actor_user_id,
          action_type,
          target_type,
          target_id,
          details_json,
          created_at
        )
        VALUES (?, ?, 'lesson_complete', 'lesson', ?, ?, ?)
        `
      ).bind(
        makeId("al"),
        userId,
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
      user_id: userId,
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
      {
        ok: false,
        error: String(error),
        lesson_slug: lessonSlug,
        user_id: userId
      },
      500
    );
  }
}