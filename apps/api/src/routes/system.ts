import { getDbHealth } from "../lib/db";
import { json } from "../lib/json";

export interface SystemEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  LEDGER_QUEUE: Queue;
}

export async function dbTestRoute(env: SystemEnv): Promise<Response> {
  try {
    const db = await getDbHealth(env.DB);

    return json({
      ok: true,
      db
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

export async function queueTestRoute(env: SystemEnv): Promise<Response> {
  try {
    await env.LEDGER_QUEUE.send({
      type: "foundation.queue_test",
      created_at: new Date().toISOString(),
      source: "fetch:/api/queue-test"
    });

    return json({
      ok: true,
      queued: true
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

export async function r2TestRoute(env: SystemEnv): Promise<Response> {
  try {
    const key = "foundation/healthcheck.txt";
    const content = `Tueban R2 test at ${new Date().toISOString()}`;

    await env.MEDIA.put(key, content, {
      httpMetadata: {
        contentType: "text/plain; charset=utf-8"
      }
    });

    return json({
      ok: true,
      key
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