import { json } from "../lib/json";

export function healthRoute(): Response {
  return json({
    ok: true,
    service: "tueban-api",
    now: new Date().toISOString()
  });
}