/**
 * P13.1.3 — Kiểm chứng kết nối database (dùng được cho PostgreSQL local VÀ Neon).
 *
 * Chạy:
 *   DATABASE_URL="postgresql://…" DIRECT_URL="postgresql://…" pnpm tsx scripts/verify-db.ts
 *
 * Nguyên tắc an toàn:
 * - KHÔNG bao giờ in chuỗi kết nối / mật khẩu (chỉ in trạng thái có/không và thông tin công khai).
 * - CHỈ ĐỌC: dùng truy vấn `SELECT` và kiểm quyền bằng `has_*_privilege` — KHÔNG ghi/xóa dữ liệu.
 * - Trả mã thoát khác 0 nếu kết nối runtime (DATABASE_URL) thất bại.
 */
import { PrismaClient } from "@prisma/client";

type Row = Record<string, unknown>;

function mask(tag: string, ok: boolean): string {
  return `${ok ? "[OK]  " : "[MISS]"} ${tag}`;
}

async function query(client: PrismaClient, sql: string): Promise<Row[]> {
  return client.$queryRawUnsafe<Row[]>(sql);
}

async function checkConnection(label: string, url: string): Promise<boolean> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await query(client, "SELECT 1 AS ok");
    const ok = Number((rows[0] as { ok?: number })?.ok) === 1;
    console.log(`${ok ? "[OK]  " : "[FAIL]"} ${label}: kết nối thành công`);

    const meta = await query(
      client,
      "SELECT current_database() AS db, current_user AS usr, version() AS ver",
    );
    const m = meta[0] as { db?: string; usr?: string; ver?: string };
    console.log(`        database=${m.db} · user=${m.usr}`);
    console.log(`        ${String(m.ver ?? "").split(",")[0]}`);

    const priv = await query(
      client,
      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AS can_use",
    );
    console.log(
      `        quyền USAGE schema public: ${Boolean((priv[0] as { can_use?: boolean })?.can_use)}`,
    );

    return ok;
  } catch (error) {
    console.log(`[FAIL] ${label}: ${(error as Error).name} — ${(error as Error).message}`);
    return false;
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}

async function checkReadAndWritePrivilege(url: string): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    // Đọc thật qua Prisma Client (không phải raw) — chứng minh client hoạt động.
    const count = await client.taxonomyType.count();
    console.log(`[OK]  Prisma Client đọc được (taxonomy_types: ${count} dòng)`);

    // Kiểm quyền GHI bằng introspection — KHÔNG ghi dữ liệu thật.
    const rows = await query(
      client,
      "SELECT has_table_privilege(current_user, 'taxonomy_types', 'INSERT') AS can_insert, " +
        "has_table_privilege(current_user, 'taxonomy_types', 'UPDATE') AS can_update, " +
        "has_table_privilege(current_user, 'taxonomy_types', 'DELETE') AS can_delete",
    );
    const p = rows[0] as { can_insert?: boolean; can_update?: boolean; can_delete?: boolean };
    console.log(
      `        quyền ghi (INSERT/UPDATE/DELETE): ${Boolean(p.can_insert)}/${Boolean(p.can_update)}/${Boolean(p.can_delete)}`,
    );
  } catch (error) {
    console.log(`[WARN] Prisma Client/quyền ghi: ${(error as Error).message}`);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}

async function checkMigrationHistory(url: string): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await query(
      client,
      "SELECT COUNT(*)::int AS n, MAX(migration_name) AS last FROM _prisma_migrations WHERE finished_at IS NOT NULL",
    );
    const r = rows[0] as { n?: number; last?: string | null };
    console.log(`[OK]  Lịch sử migration: ${r.n ?? 0} migration đã áp · gần nhất=${r.last ?? "(không có)"}`);
  } catch (error) {
    console.log(`[WARN] Bảng _prisma_migrations chưa tồn tại: ${(error as Error).message}`);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  console.log("=== Kiểm chứng kết nối database (P13.1.3) ===");
  console.log(mask("DATABASE_URL (pooled/runtime)", Boolean(pooled)));
  console.log(mask("DIRECT_URL (direct/migration)", Boolean(direct)));

  if (!pooled) {
    console.log("\n[BLOCKED] Thiếu DATABASE_URL — không thể kiểm chứng kết nối runtime.");
    console.log("→ Xem docs/P13/P13.1_NEON_INTEGRATION_REPORT.md (hướng dẫn thủ công) để cấu hình.");
    process.exit(2);
  }

  console.log("\n--- 1) Kết nối runtime (DATABASE_URL) ---");
  const okPooled = await checkConnection("Runtime DATABASE_URL", pooled);

  if (okPooled) {
    console.log("\n--- 2) Prisma Client + quyền đọc/ghi ---");
    await checkReadAndWritePrivilege(pooled);

    console.log("\n--- 3) Lịch sử migration ---");
    await checkMigrationHistory(pooled);
  }

  if (direct) {
    console.log("\n--- 4) Kết nối migration (DIRECT_URL) ---");
    await checkConnection("Migration DIRECT_URL", direct);
  } else {
    console.log("\n--- 4) Kết nối migration (DIRECT_URL) ---");
    console.log("[SKIP] Không có DIRECT_URL (chỉ cần khi chạy `prisma migrate`).");
  }

  console.log(`\n=== Kết quả: runtime ${okPooled ? "PASS" : "FAIL"} ===`);
  process.exit(okPooled ? 0 : 1);
}

main().catch((error) => {
  console.error(`[FAIL] ${(error as Error).message}`);
  process.exit(1);
});
