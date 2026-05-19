import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";

export interface QuizEnv {
  DB: D1Database;
}

function nowTs(): number { return Math.floor(Date.now() / 1000); }
function makeId(prefix: string): string { return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`; }
async function readJsonBody<T>(request: Request): Promise<T | null> { try { return (await request.json()) as T; } catch { return null; } }

export async function quizByTopicRoute(
  request: Request,
  env: QuizEnv,
  topicSlug: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const topic = await env.DB.prepare(
    `SELECT id FROM course_topics WHERE slug = ? LIMIT 1`
  )
    .bind(topicSlug)
    .first<{ id: string }>();

  if (!topic) return json({ ok: false, error: "Topic not found" }, 404);

  const quizzes = await env.DB.prepare(
    `SELECT id, title, min_pass_score FROM quizzes WHERE topic_id = ?`
  )
    .bind(topic.id)
    .all<{ id: string; title: string; min_pass_score: number }>();

  const result = [];
  for (const quiz of quizzes.results ?? []) {
    const questions = await env.DB.prepare(
      `SELECT id, question_text, position, question_type FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC`
    )
      .bind(quiz.id)
      .all<{ id: string; question_text: string; position: number; question_type: string }>();

    const questionsWithOptions = [];
    for (const question of questions.results ?? []) {
      const options = await env.DB.prepare(
        `SELECT id, option_text, position FROM quiz_options WHERE question_id = ? ORDER BY position ASC`
      )
        .bind(question.id)
        .all<{ id: string; option_text: string; position: number }>();

      questionsWithOptions.push({
        ...question,
        options: options.results ?? []
      });
    }

    result.push({
      ...quiz,
      questions: questionsWithOptions
    });
  }

  return json({ ok: true, topic_slug: topicSlug, quizzes: result });
}

export async function quizStartRoute(
  request: Request,
  env: QuizEnv,
  quizId: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const quiz = await env.DB.prepare(
    `SELECT id, topic_id, title FROM quizzes WHERE id = ? LIMIT 1`
  )
    .bind(quizId)
    .first<{ id: string; topic_id: string; title: string }>();

  if (!quiz) return json({ ok: false, error: "Quiz not found" }, 404);

  const attemptId = makeId("qa");
  const timestamp = nowTs();

  await env.DB.prepare(
    `INSERT INTO quiz_attempts (id, quiz_id, user_id, score, passed, started_at)
     VALUES (?, ?, ?, 0, 0, ?)`
  ).bind(attemptId, quizId, user.user_id, timestamp).run();

  return json({ ok: true, attempt: { id: attemptId, quiz_id: quizId, started_at: timestamp } });
}

export async function quizSubmitRoute(
  request: Request,
  env: QuizEnv,
  attemptId: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: false, error: "Not authenticated" }, 401);

  const attempt = await env.DB.prepare(
    `SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ? LIMIT 1`
  )
    .bind(attemptId, user.user_id)
    .first<{ id: string; quiz_id: string; submitted_at: number | null }>();

  if (!attempt) return json({ ok: false, error: "Attempt not found" }, 404);
  if (attempt.submitted_at) return json({ ok: false, error: "Already submitted" }, 400);

  const body = await readJsonBody<{ answers?: { question_id: string; selected_option_id?: string; answer_text?: string }[] }>(request);
  if (!body?.answers) return json({ ok: false, error: "Missing answers" }, 400);

  const quiz = await env.DB.prepare(
    `SELECT min_pass_score FROM quizzes WHERE id = ? LIMIT 1`
  )
    .bind(attempt.quiz_id)
    .first<{ min_pass_score: number }>();

  let correctCount = 0;
  const timestamp = nowTs();

  for (const answer of body.answers) {
    const option = await env.DB.prepare(
      `SELECT id, is_correct FROM quiz_options WHERE id = ? AND question_id = ? LIMIT 1`
    )
      .bind(answer.selected_option_id, answer.question_id)
      .first<{ id: string; is_correct: number }>();

    const isCorrect = option?.is_correct === 1 ? 1 : 0;
    if (isCorrect) correctCount++;

    await env.DB.prepare(
      `INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option_id, answer_text, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(makeId("qaa"), attemptId, answer.question_id, answer.selected_option_id || null, answer.answer_text || null, isCorrect).run();
  }

  const totalQuestions = body.answers.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= (quiz?.min_pass_score || 70) ? 1 : 0;

  await env.DB.prepare(
    `UPDATE quiz_attempts SET score = ?, passed = ?, submitted_at = ? WHERE id = ?`
  ).bind(score, passed, timestamp, attemptId).run();

  await env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, action_type, target_type, target_id, details_json, created_at)
     VALUES (?, ?, 'quiz_submit', 'quiz_attempt', ?, ?, ?)`
  ).bind(makeId("al"), user.user_id, attemptId, JSON.stringify({ quiz_id: attempt.quiz_id, score, passed }), timestamp).run();

  return json({
    ok: true,
    attempt_id: attemptId,
    score,
    total_questions: totalQuestions,
    correct_count: correctCount,
    passed: passed === 1,
    min_pass_score: quiz?.min_pass_score || 70
  });
}
