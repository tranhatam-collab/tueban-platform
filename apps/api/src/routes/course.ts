import { json } from "../lib/json";

export interface CourseEnv {
  DB: D1Database;
}

type CourseDetailRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  level: string;
  visibility: string;
  status: string;
  cover_image_asset_id: string | null;
  created_by: string | null;
  created_at: number;
  updated_at: number;
};

export async function courseDetailRoute(
  env: CourseEnv,
  courseSlug: string
): Promise<Response> {
  try {
    const course = await env.DB.prepare(
      `
      SELECT
        id,
        slug,
        title,
        short_description,
        long_description,
        level,
        visibility,
        status,
        cover_image_asset_id,
        created_by,
        created_at,
        updated_at
      FROM courses
      WHERE slug = ?
      LIMIT 1
      `
    )
      .bind(courseSlug)
      .first<CourseDetailRow>();

    if (!course) {
      return json(
        {
          ok: false,
          error: "Course not found",
          slug: courseSlug
        },
        404
      );
    }

    return json({
      ok: true,
      course
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(error),
        slug: courseSlug
      },
      500
    );
  }
}