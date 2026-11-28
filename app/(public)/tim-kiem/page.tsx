import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  robots: { index: false, follow: true },
};

/**
 * `/tim-kiem` — lối vào tìm kiếm cũ.
 *
 * Hạ tầng tìm kiếm công thức thực tế nằm ở `/cong-thuc` (dùng truy vấn `q`). Trang này
 * chỉ chuyển hướng để không còn lối vào chết (P11 — BUG-P11-01).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim() : "";
  redirect(keyword ? `/cong-thuc?q=${encodeURIComponent(keyword)}` : "/cong-thuc");
}
