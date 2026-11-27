import { describe, expect, it } from "vitest";

import { testDb } from "./helpers/db";

describe("P06 — schema & migration (database thử nghiệm)", () => {
  it("đã áp migration và tạo đủ bảng nghiệp vụ", async () => {
    const rows = await testDb.$queryRaw<{ count: number }[]>`
      select count(*)::int as count
      from information_schema.tables
      where table_schema = 'public' and table_name <> '_prisma_migrations'
    `;
    expect(rows[0].count).toBeGreaterThanOrEqual(57);
  });

  it("có các extension cần thiết (citext, pg_trgm, unaccent)", async () => {
    const rows = await testDb.$queryRaw<{ extname: string }[]>`
      select extname from pg_extension
    `;
    const names = rows.map((r) => r.extname);
    expect(names).toContain("citext");
    expect(names).toContain("pg_trgm");
    expect(names).toContain("unaccent");
  });

  it("khóa chính dùng UUID với mặc định gen_random_uuid()", async () => {
    const rows = await testDb.$queryRaw<{ column_default: string | null }[]>`
      select column_default
      from information_schema.columns
      where table_schema = 'public' and table_name = 'units' and column_name = 'id'
    `;
    expect(rows[0].column_default).toContain("gen_random_uuid");
  });

  it("đã ghi nhận migration đã áp dụng trong _prisma_migrations", async () => {
    const rows = await testDb.$queryRaw<{ migration_name: string; applied: boolean }[]>`
      select migration_name, finished_at is not null as applied
      from _prisma_migrations
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.every((r) => r.applied)).toBe(true);
  });

  it("timestamp dùng timestamptz (UTC)", async () => {
    const rows = await testDb.$queryRaw<{ data_type: string }[]>`
      select data_type
      from information_schema.columns
      where table_schema = 'public' and table_name = 'recipes' and column_name = 'created_at'
    `;
    expect(rows[0].data_type).toBe("timestamp with time zone");
  });
});
