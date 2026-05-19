export interface SessionUser {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

export interface SessionEnv {
  DB: D1Database;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return null;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getCurrentUser(
  request: Request,
  env: SessionEnv
): Promise<SessionUser | null> {
  const token = getCookieValue(request, "tueban_session");
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);

  const row = await env.DB.prepare(
    `
    SELECT
      u.id AS user_id,
      u.email,
      u.full_name,
      COALESCE(json_group_array(DISTINCT r.code), '[]') AS roles_json
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > ?
    GROUP BY u.id
    LIMIT 1
    `
  )
    .bind(tokenHash, now)
    .first<{ user_id: string; email: string; full_name: string | null; roles_json: string }>();

  if (!row) return null;

  let roles: string[] = [];
  try {
    roles = JSON.parse(row.roles_json).filter(Boolean);
  } catch {
    roles = [];
  }

  return {
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name,
    roles,
  };
}
