import { json } from "../lib/json";
import { getCurrentUser } from "../lib/session";

export interface AssetsEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function assetUrlRoute(
  request: Request,
  env: AssetsEnv,
  assetId: string
): Promise<Response> {
  const user = await getCurrentUser(request, env);

  const asset = await env.DB.prepare(
    `SELECT * FROM media_assets WHERE id = ? LIMIT 1`
  )
    .bind(assetId)
    .first<{
      id: string; title: string; storage_path: string; mime_type: string | null;
      visibility: string; asset_type: string;
    }>();

  if (!asset) {
    return json({ ok: false, error: "Asset not found" }, 404);
  }

  if (asset.visibility === "protected" && !user) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  if (user) {
    await env.DB.prepare(
      `INSERT INTO user_file_access (id, user_id, asset_id, access_type, accessed_at)
       VALUES (?, ?, ?, 'open', ?)`
    ).bind(makeId("ufa"), user.user_id, asset.id, Math.floor(Date.now() / 1000)).run();
  }

  const object = await env.MEDIA.get(asset.storage_path);
  if (!object) {
    return json({ ok: false, error: "File not found in storage" }, 404);
  }

  const signedUrl = await env.MEDIA.createPresignedUrl(asset.storage_path, {
    method: "GET",
    expiresIn: 900,
  });

  return json({
    ok: true,
    asset: {
      id: asset.id,
      title: asset.title,
      asset_type: asset.asset_type,
      mime_type: asset.mime_type,
    },
    signed_url: signedUrl,
    expires_in: 900,
  });
}
