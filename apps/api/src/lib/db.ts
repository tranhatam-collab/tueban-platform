export async function getDbHealth(db: D1Database): Promise<{ message: string | null }> {
  const result = await db
    .prepare("SELECT 'tueban-db-ok' AS message")
    .first<{ message: string }>();

  return {
    message: result?.message ?? null
  };
}