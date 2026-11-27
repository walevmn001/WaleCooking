import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cho phép HMR/dev resource khi xem qua host proxy của môi trường preview (dev-only).
  allowedDevOrigins: ['127.0.0.1', '*.trae.ai'],
  // Ảnh SVG brand (P04) là tài nguyên do dự án tạo và đã kiểm định an toàn
  // (xem docs/P04/ASSET_QA_CHECKLIST.md) → cho phép next/image phục vụ SVG.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
