import { json } from "../lib/json";

export interface CoursesEnv {
  DB: D1Database;
}

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  level: string;
  visibility: string;
  status: string;
  created_at: number;
  updated_at: number;
};

type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
};

type TopicRow = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string | null;
  position: number;
};

type LessonRow = {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  lesson_type: string;
  completion_mode: string;
  position: number;
  status: string;
};

export async function listCoursesRoute(env: CoursesEnv): Promise<Response> {
  try {
    const rows = await env.DB.prepare(
      `
      SELECT
        id,
        slug,
        title,
        short_description,
        level,
        visibility,
        status,
        created_at,
        updated_at
      FROM courses
      ORDER BY updated_at DESC, created_at DESC
      `
    ).all<CourseRow>();

    return json({
      ok: true,
      courses: rows.results ?? []
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(error)
      },
      500
    );
  }
}

export async function courseOutlineRoute(env: CoursesEnv, courseSlug: string): Promise<Response> {
  try {
    const course = await env.DB.prepare(
      `
      SELECT
        id,
        slug,
        title,
        short_description,
        level,
        visibility,
        status,
        created_at,
        updated_at
      FROM courses
      WHERE slug = ?
      LIMIT 1
      `
    )
      .bind(courseSlug)
      .first<CourseRow>();

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

    const modulesResult = await env.DB.prepare(
      `
      SELECT
        id,
        course_id,
        title,
        description,
        position
      FROM course_modules
      WHERE course_id = ?
      ORDER BY position ASC
      `
    )
      .bind(course.id)
      .all<ModuleRow>();

    const topicsResult = await env.DB.prepare(
      `
      SELECT
        t.id,
        t.module_id,
        t.slug,
        t.title,
        t.description,
        t.position
      FROM course_topics t
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE m.course_id = ?
      ORDER BY m.position ASC, t.position ASC
      `
    )
      .bind(course.id)
      .all<TopicRow>();

    const lessonsResult = await env.DB.prepare(
      `
      SELECT
        l.id,
        l.topic_id,
        l.slug,
        l.title,
        l.lesson_type,
        l.completion_mode,
        l.position,
        l.status
      FROM lessons l
      INNER JOIN course_topics t ON t.id = l.topic_id
      INNER JOIN course_modules m ON m.id = t.module_id
      WHERE m.course_id = ?
      ORDER BY m.position ASC, t.position ASC, l.position ASC
      `
    )
      .bind(course.id)
      .all<LessonRow>();

    const modules = (modulesResult.results ?? []).map((module) => {
      const topics = (topicsResult.results ?? [])
        .filter((topic) => topic.module_id === module.id)
        .map((topic) => {
          const lessons = (lessonsResult.results ?? []).filter(
            (lesson) => lesson.topic_id === topic.id
          );

          return {
            ...topic,
            lessons
          };
        });

      return {
        ...module,
        topics
      };
    });

    return json({
      ok: true,
      course,
      modules
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