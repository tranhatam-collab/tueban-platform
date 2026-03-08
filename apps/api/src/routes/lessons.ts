import { json } from "../lib/json";

export interface LessonsEnv {
  DB: D1Database;
}

type LessonDetailRow = {
  id: string;
  slug: string;
  title: string;
  lesson_type: string;
  content_md: string | null;
  estimated_minutes: number;
  completion_mode: string;
  is_preview: number;
  status: string;
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  course_slug: string;
  course_title: string;
};

type LessonAssetRow = {
  asset_id: string;
  asset_type: string;
  title: string;
  storage_path: string;
  mime_type: string | null;
  visibility: string;
  purpose: string;
  position: number;
  is_required: number;
  downloadable: number;
};

export async function lessonDetailRoute(
  env: LessonsEnv,
  lessonSlug: string
): Promise<Response> {
  try {
    const lesson = await env.DB.prepare(
      `
      SELECT
        l.id,
        l.slug,
        l.title,
        l.lesson_type,
        l.content_md,
        l.estimated_minutes,
        l.completion_mode,
        l.is_preview,
        l.status,
        t.id AS topic_id,
        t.slug AS topic_slug,
        t.title AS topic_title,
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
      .first<LessonDetailRow>();

    if (!lesson) {
      return json(
        {
          ok: false,
          error: "Lesson not found",
          slug: lessonSlug
        },
        404
      );
    }

    const assetsResult = await env.DB.prepare(
      `
      SELECT
        a.id AS asset_id,
        a.asset_type,
        a.title,
        a.storage_path,
        a.mime_type,
        a.visibility,
        la.purpose,
        la.position,
        la.is_required,
        la.downloadable
      FROM lesson_assets la
      INNER JOIN media_assets a ON a.id = la.asset_id
      WHERE la.lesson_id = ?
      ORDER BY la.position ASC
      `
    )
      .bind(lesson.id)
      .all<LessonAssetRow>();

    return json({
      ok: true,
      lesson,
      assets: assetsResult.results ?? []
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(error),
        slug: lessonSlug
      },
      500
    );
  }
}