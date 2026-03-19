import { healthRoute } from "./routes/health";
import {
  dbTestRoute,
  queueTestRoute,
  r2TestRoute,
  type SystemEnv
} from "./routes/system";
import { listCoursesRoute, courseOutlineRoute } from "./routes/courses";
import { courseDetailRoute } from "./routes/course";
import { lessonDetailRoute } from "./routes/lessons";
import { progressRoute } from "./routes/progress";
import { completeLessonRoute } from "./routes/lesson-actions";
import { adminRoute, type AdminEnv } from "./routes/admin";
import { json } from "./lib/json";

export interface Env extends SystemEnv, AdminEnv {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();
    const segments = pathname.split("/").filter(Boolean);

    if (pathname === "/api/health") {
      return healthRoute();
    }

    if (pathname === "/api/db-test") {
      return dbTestRoute(env);
    }

    if (pathname === "/api/queue-test") {
      return queueTestRoute(env);
    }

    if (pathname === "/api/r2-test") {
      return r2TestRoute(env);
    }

    if (method === "GET" && pathname === "/api/courses") {
      return listCoursesRoute(env);
    }

    if (
      method === "GET" &&
      segments.length === 3 &&
      segments[0] === "api" &&
      segments[1] === "course"
    ) {
      const courseSlug = segments[2];
      return courseDetailRoute(env, courseSlug);
    }

    if (
      method === "GET" &&
      segments.length === 4 &&
      segments[0] === "api" &&
      segments[1] === "courses" &&
      segments[3] === "outline"
    ) {
      const courseSlug = segments[2];
      return courseOutlineRoute(env, courseSlug);
    }

    if (
      method === "GET" &&
      segments.length === 3 &&
      segments[0] === "api" &&
      segments[1] === "lessons"
    ) {
      const lessonSlug = segments[2];
      return lessonDetailRoute(env, lessonSlug);
    }

    if (method === "GET" && pathname === "/api/progress") {
      return progressRoute(request, env);
    }

    if (method === "POST" && pathname === "/api/lesson/complete") {
      return completeLessonRoute(request, env);
    }

    if (
      segments.length >= 3 &&
      segments[0] === "api" &&
      segments[1] === "admin"
    ) {
      return adminRoute(request, env, segments);
    }

    return json(
      {
        ok: false,
        error: "Not found",
        method,
        path: pathname
      },
      404
    );
  },

  async queue(batch: MessageBatch<unknown>): Promise<void> {
    for (const message of batch.messages) {
      console.log("Queue message received:", JSON.stringify(message.body));
      message.ack();
    }
  }
};