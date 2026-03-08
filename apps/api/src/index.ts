import { healthRoute } from "./routes/health";
import {
  dbTestRoute,
  queueTestRoute,
  r2TestRoute,
  type SystemEnv
} from "./routes/system";
import { json } from "./lib/json";

export interface Env extends SystemEnv {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

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

    return json(
      {
        ok: false,
        error: "Not found",
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