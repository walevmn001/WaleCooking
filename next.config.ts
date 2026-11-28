import type { NextConfig } from 'next';

/**
 * Security headers áp dụng cho mọi route (P11 — hardening, trước đây thiếu).
 * KHÔNG đặt CSP ở đây: Next.js cần inline style/script cho hydration — sẽ cân nhắc
 * nonce-based CSP ở phase sau (Backlog), tránh rủi ro làm hỏng giao diện.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ẩn `X-Powered-By` để không lộ stack (P11).
  poweredByHeader: false,
  // Ảnh SVG brand (P04) là tài nguyên do dự án tạo và đã kiểm định an toàn
  // (xem docs/P04/ASSET_QA_CHECKLIST.md) → cho phép next/image phục vụ SVG.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
