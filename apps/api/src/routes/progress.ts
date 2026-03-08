import { json } from "../lib/json";

export interface ProgressEnv {
  DB: D1Database;
}

type CourseProgressRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  started_at: number | null;
  completed_at: number | null;
  updated_at: number;
};

type TopicProgressRow = {
  id: string;
  topic_id: string;
  title: string;
  slug: string;
  status: string;
  started_at: number | null;
  completed_at: number | null;
  approved_at: number | null;
  updated_at: number;
};

type LessonProgressRow = {
  id: string;
  lesson_id: string;
  title: string;
  slug: string;
  status: string;
  active_learning_seconds: number;
  video_watch_seconds: number;
  reading_estimate_seconds: number;
  opened_at: number | null;
  completed_at: number | null;
  updated_at: number;
};

export async function progressRoute(
  request: Request,
  env: ProgressEnv
): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const courseId = url.searchParams.get("course_id");

  if (!userId || !courseId) {
    return json(
      {
        ok: false,
        error: "Missing user_id or course_id query parameter"
      },
      400
    );
  }

  try {
    const courseProgress = await env.DB.prepare(
      `
      SELECT
        id,
        user_id,
        course_id,
        status,
        progress_percent,
        started_at,
        completed_at,
        updated_at
      FROM user_course_progress
      WHERE user_id = ? AND course_id = ?
      LIMIT 1
      `
    )
      .bind(userId, courseId)
      .first<CourseProgressRow>();

    const topicProgresses = await env.DB.prepare(
      `
      SELECT
        utp.id,
        utp.topic_id,
        t.title,
        t.slug,
        utp.status,
        utp.started_at,
        utp.completed_at,
        utp.approved_at,
        utp.updated_at
      FROM user_topic_progress utp
      INNER JOIN course_topics t ON t.id = utp.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE utp.user_id = ? AND m.course_id = ?
      ORDER BY m.position ASC, t.position ASC
      `
    )
      .bind(userId, courseId)
      .all<TopicProgressRow>();

    const lessonProgresses = await env.DB.prepare(
      `
      SELECT
        ulp.id,
        ulp.lesson_id,
        l.title,
        l.slug,
        ulp.status,
        ulp.active_learning_seconds,
        ulp.video_watch_seconds,
        ulp.reading_estimate_seconds,
        ulp.opened_at,
        ulp.completed_at,
        ulp.updated_at
      FROM user_lesson_progress ulp
      INNER JOIN lessons l ON l.id = ulp.lesson_id
      INNER JOIN course_topics t ON t.id = l.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE ulp.user_id = ? AND m.course_id = ?
      ORDER BY m.position ASC, t.position ASC, l.position ASC
      `
    )
      .bind(userId, courseId)
      .all<LessonProgressRow>();

    return json({
      ok: true,
      user_id: userId,
      course_id: courseId,
      course_progress: courseProgress ?? null,
      topic_progresses: topicProgresses.results ?? [],
      lesson_progresses: lessonProgresses.results ?? []
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(error),
        user_id: userId,
        course_id: courseId
      },
      500
    );
  }
}