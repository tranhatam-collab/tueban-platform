import { json } from "../lib/json";

export interface EventsEnv {
  DB: D1Database;
}

export async function listEventsRoute(env: EventsEnv): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, slug, title, event_type, description_md, starts_at, ends_at, location_text, status, created_at, updated_at
     FROM events
     WHERE status = 'published'
     ORDER BY starts_at ASC`
  ).all();
  return json({ ok: true, events: rows.results ?? [] });
}

export async function eventDetailRoute(env: EventsEnv, eventSlug: string): Promise<Response> {
  const event = await env.DB.prepare(
    `SELECT * FROM events WHERE slug = ? AND status = 'published' LIMIT 1`
  )
    .bind(eventSlug)
    .first();
  if (!event) return json({ ok: false, error: "Event not found" }, 404);
  return json({ ok: true, event });
}
