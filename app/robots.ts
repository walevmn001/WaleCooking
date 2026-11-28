import type { MetadataRoute } from "next";

/**
 * `robots.txt` (P11 — bổ sung SEO, trước đây thiếu → 404).
 *
 * - Cho phép index nội dung công khai.
 * - Chặn khu vực quản trị, API và trang dev.
 * - Trỏ tới sitemap.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/dev/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
