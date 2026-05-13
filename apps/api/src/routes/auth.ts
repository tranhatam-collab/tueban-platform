import { json } from "../lib/json";

export interface AuthEnv {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_ALLOWED_DOMAIN?: string;
  MAGIC_LINK_BASE_URL?: string;
  MAGIC_LINK_FROM_EMAIL?: string;
  RESEND_API_KEY?: string;
}

type MagicLinkInput = {
  email?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function nowTs(): number {
  return Math.floor(Date.now() / 1000);
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function getBaseUrl(request: Request, env: AuthEnv): string {
  return env.MAGIC_LINK_BASE_URL || new URL(request.url).origin;
}

function authRedirectUrl(request: Request, env: AuthEnv): string {
  return env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`;
}

function missingConfig(error: string, requiredSecrets: string[]): Response {
  return json(
    {
      ok: false,
      error,
      required_secrets: requiredSecrets
    },
    501
  );
}

async function upsertUser(env: AuthEnv, email: string, fullName: string | null): Promise<string> {
  const timestamp = nowTs();
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string }>();

  if (existing?.id) {
    await env.DB.prepare(
      `
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          status = 'active',
          updated_at = ?
      WHERE id = ?
      `
    )
      .bind(fullName, timestamp, existing.id)
      .run();

    return existing.id;
  }

  const userId = makeId("user");
  await env.DB.prepare(
    `
    INSERT INTO users (id, email, password_hash, full_name, status, created_at, updated_at)
    VALUES (?, ?, NULL, ?, 'active', ?, ?)
    `
  )
    .bind(userId, email, fullName, timestamp, timestamp)
    .run();

  return userId;
}

async function createSession(env: AuthEnv, request: Request, userId: string): Promise<string> {
  const sessionToken = randomToken(48);
  const tokenHash = await sha256Hex(sessionToken);
  const timestamp = nowTs();
  const expiresAt = timestamp + 60 * 60 * 24 * 30;

  await env.DB.prepare(
    `
    INSERT INTO sessions (
      id,
      user_id,
      token_hash,
      ip_address,
      user_agent,
      expires_at,
      created_at,
      revoked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `
  )
    .bind(
      makeId("sess"),
      userId,
      tokenHash,
      request.headers.get("cf-connecting-ip"),
      request.headers.get("user-agent"),
      expiresAt,
      timestamp
    )
    .run();

  return sessionToken;
}

function sessionCookie(token: string): string {
  return `tueban_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

function redirectWithSession(location: string, token: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location,
      "set-cookie": sessionCookie(token),
      "cache-control": "no-store"
    }
  });
}

export function googleStartRoute(request: Request, env: AuthEnv): Response {
  if (!env.GOOGLE_CLIENT_ID) {
    return missingConfig("GOOGLE_OAUTH_NOT_CONFIGURED", [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI"
    ]);
  }

  const url = new URL(request.url);
  const state = randomToken(24);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", authRedirectUrl(request, env));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  if (url.searchParams.get("redirect") === "1") {
    return new Response(null, {
      status: 302,
      headers: {
        location: authUrl.toString(),
        "cache-control": "no-store"
      }
    });
  }

  return json({
    ok: true,
    provider: "google",
    auth_url: authUrl.toString(),
    state,
    redirect_uri: authRedirectUrl(request, env)
  });
}

export async function googleCallbackRoute(request: Request, env: AuthEnv): Promise<Response> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return missingConfig("GOOGLE_OAUTH_NOT_CONFIGURED", [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI"
    ]);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return json(
      {
        ok: false,
        error: "Missing Google OAuth code"
      },
      400
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: authRedirectUrl(request, env),
      grant_type: "authorization_code"
    })
  });
  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

  if (!tokenRes.ok || !tokenData.access_token) {
    return json(
      {
        ok: false,
        error: "GOOGLE_TOKEN_EXCHANGE_FAILED",
        provider_error: tokenData.error || "unknown"
      },
      401
    );
  }

  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${tokenData.access_token}`
    }
  });
  const userInfo = (await userRes.json()) as GoogleUserInfo;
  const email = normalizeEmail(userInfo.email);

  if (!userRes.ok || !email || userInfo.email_verified === false) {
    return json(
      {
        ok: false,
        error: "GOOGLE_USERINFO_INVALID"
      },
      401
    );
  }

  if (env.GOOGLE_ALLOWED_DOMAIN && !email.endsWith(`@${env.GOOGLE_ALLOWED_DOMAIN}`)) {
    return json(
      {
        ok: false,
        error: "GOOGLE_DOMAIN_NOT_ALLOWED"
      },
      403
    );
  }

  const userId = await upsertUser(env, email, userInfo.name || null);
  const sessionToken = await createSession(env, request, userId);
  return redirectWithSession(`${getBaseUrl(request, env)}/auth/?status=google_ok`, sessionToken);
}

export async function magicLinkRequestRoute(request: Request, env: AuthEnv): Promise<Response> {
  if (!env.RESEND_API_KEY || !env.MAGIC_LINK_FROM_EMAIL || !env.MAGIC_LINK_BASE_URL) {
    return missingConfig("MAGIC_LINK_EMAIL_NOT_CONFIGURED", [
      "RESEND_API_KEY",
      "MAGIC_LINK_FROM_EMAIL",
      "MAGIC_LINK_BASE_URL"
    ]);
  }

  const body = await readJsonBody<MagicLinkInput>(request);
  const email = normalizeEmail(body?.email);

  if (!email) {
    return json(
      {
        ok: false,
        error: "Invalid email"
      },
      400
    );
  }

  const token = randomToken(48);
  const tokenHash = await sha256Hex(token);
  const timestamp = nowTs();
  const expiresAt = timestamp + 60 * 15;
  const link = `${env.MAGIC_LINK_BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

  await env.DB.prepare(
    `
    INSERT INTO auth_magic_links (id, email, token_hash, expires_at, consumed_at, created_at)
    VALUES (?, ?, ?, ?, NULL, ?)
    `
  )
    .bind(makeId("ml"), email, tokenHash, expiresAt, timestamp)
    .run();

  const mailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.MAGIC_LINK_FROM_EMAIL,
      to: email,
      subject: "Đăng nhập Tueban",
      text: `Mở liên kết này trong 15 phút để đăng nhập Tueban: ${link}`
    })
  });

  if (!mailRes.ok) {
    return json(
      {
        ok: false,
        error: "MAGIC_LINK_EMAIL_SEND_FAILED"
      },
      502
    );
  }

  return json({
    ok: true,
    message: "Magic link sent if the email is allowed."
  });
}

export async function magicLinkVerifyRoute(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json(
      {
        ok: false,
        error: "Missing token"
      },
      400
    );
  }

  const tokenHash = await sha256Hex(token);
  const timestamp = nowTs();
  const magicLink = await env.DB.prepare(
    `
    SELECT id, email
    FROM auth_magic_links
    WHERE token_hash = ?
      AND consumed_at IS NULL
      AND expires_at > ?
    LIMIT 1
    `
  )
    .bind(tokenHash, timestamp)
    .first<{ id: string; email: string }>();

  if (!magicLink) {
    return json(
      {
        ok: false,
        error: "MAGIC_LINK_INVALID_OR_EXPIRED"
      },
      401
    );
  }

  await env.DB.prepare("UPDATE auth_magic_links SET consumed_at = ? WHERE id = ?")
    .bind(timestamp, magicLink.id)
    .run();

  const userId = await upsertUser(env, magicLink.email, null);
  const sessionToken = await createSession(env, request, userId);
  return redirectWithSession(`${getBaseUrl(request, env)}/auth/?status=magic_ok`, sessionToken);
}
