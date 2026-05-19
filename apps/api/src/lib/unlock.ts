export interface UnlockEnv {
  DB: D1Database;
}

export interface UnlockResult {
  unlocked: boolean;
  missing: string[];
}

export async function evaluateUnlock(
  env: UnlockEnv,
  userId: string,
  lessonId: string
): Promise<UnlockResult> {
  const missing: string[] = [];

  const rules = await env.DB.prepare(
    `SELECT * FROM lesson_unlock_rules WHERE lesson_id = ? LIMIT 1`
  )
    .bind(lessonId)
    .first<{
      requires_previous_lesson_complete: number;
      requires_required_assets_opened: number;
      requires_practice_submitted: number;
      requires_quiz_passed: number;
      requires_instructor_approval: number;
    }>();

  if (!rules) {
    return { unlocked: true, missing: [] };
  }

  if (rules.requires_previous_lesson_complete) {
    const previous = await env.DB.prepare(
      `
      SELECT l2.id
      FROM lessons l1
      INNER JOIN course_topics t ON t.id = l1.topic_id
      INNER JOIN lessons l2 ON l2.topic_id = t.id
        AND l2.position < l1.position
      INNER JOIN course_topics t2 ON t2.id = l2.topic_id
      WHERE l1.id = ?
      ORDER BY t2.position DESC, l2.position DESC
      LIMIT 1
      `
    )
      .bind(lessonId)
      .first<{ id: string }>();

    if (previous) {
      const prevProgress = await env.DB.prepare(
        `SELECT status FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ? LIMIT 1`
      )
        .bind(userId, previous.id)
        .first<{ status: string }>();

      if (!prevProgress || prevProgress.status !== "completed") {
        missing.push("Bài học trước chưa hoàn thành");
      }
    }
  }

  if (rules.requires_required_assets_opened) {
    const requiredAssets = await env.DB.prepare(
      `
      SELECT a.id
      FROM lesson_assets la
      INNER JOIN media_assets a ON a.id = la.asset_id
      WHERE la.lesson_id = ? AND la.is_required = 1
      `
    )
      .bind(lessonId)
      .all<{ id: string }>();

    for (const asset of requiredAssets.results ?? []) {
      const access = await env.DB.prepare(
        `SELECT id FROM user_file_access WHERE user_id = ? AND asset_id = ? LIMIT 1`
      )
        .bind(userId, asset.id)
        .first<{ id: string }>();

      if (!access) {
        missing.push("Tài liệu bắt buộc chưa được mở");
        break;
      }
    }
  }

  if (rules.requires_practice_submitted) {
    const topic = await env.DB.prepare(
      `SELECT topic_id FROM lessons WHERE id = ? LIMIT 1`
    )
      .bind(lessonId)
      .first<{ topic_id: string }>();

    if (topic) {
      const tasks = await env.DB.prepare(
        `SELECT id FROM practice_tasks WHERE topic_id = ? AND required = 1`
      )
        .bind(topic.topic_id)
        .all<{ id: string }>();

      for (const task of tasks.results ?? []) {
        const submission = await env.DB.prepare(
          `SELECT id FROM practice_submissions WHERE task_id = ? AND user_id = ? LIMIT 1`
        )
          .bind(task.id, userId)
          .first<{ id: string }>();

        if (!submission) {
          missing.push("Bài tập thực hành chưa nộp");
          break;
        }
      }
    }
  }

  if (rules.requires_quiz_passed) {
    const topic = await env.DB.prepare(
      `SELECT topic_id FROM lessons WHERE id = ? LIMIT 1`
    )
      .bind(lessonId)
      .first<{ topic_id: string }>();

    if (topic) {
      const quizzes = await env.DB.prepare(
        `SELECT id FROM quizzes WHERE topic_id = ?`
      )
        .bind(topic.topic_id)
        .all<{ id: string }>();

      for (const quiz of quizzes.results ?? []) {
        const attempt = await env.DB.prepare(
          `SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND passed = 1 LIMIT 1`
        )
          .bind(quiz.id, userId)
          .first<{ id: string }>();

        if (!attempt) {
          missing.push("Quiz chưa đạt yêu cầu");
          break;
        }
      }
    }
  }

  if (rules.requires_instructor_approval) {
    const topic = await env.DB.prepare(
      `SELECT topic_id FROM lessons WHERE id = ? LIMIT 1`
    )
      .bind(lessonId)
      .first<{ topic_id: string }>();

    if (topic) {
      const tp = await env.DB.prepare(
        `SELECT approved_at FROM user_topic_progress WHERE user_id = ? AND topic_id = ? LIMIT 1`
      )
        .bind(userId, topic.topic_id)
        .first<{ approved_at: number | null }>();

      if (!tp || !tp.approved_at) {
        missing.push("Chưa được giảng viên phê duyệt");
      }
    }
  }

  return { unlocked: missing.length === 0, missing };
}
