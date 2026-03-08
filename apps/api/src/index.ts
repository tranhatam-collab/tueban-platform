export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  LEDGER_QUEUE: Queue;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

function json(data: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "tueban-api",
        now: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/db-test") {
      try {
        const result = await env.DB.prepare(
          "SELECT 'tueban-db-ok' AS message"
        ).first<{ message: string }>();

        return json({
          ok: true,
          db: {
            message: result?.message ?? null
          }
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

    if (url.pathname === "/api/queue-test") {
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

    if (url.pathname === "/api/r2-test") {
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

    return json(
      {
        ok: false,
        error: "Not found"
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
