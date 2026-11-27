import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ảnh SVG brand (P04) là tài nguyên do dự án tạo và đã kiểm định an toàn
  // (xem docs/P04/ASSET_QA_CHECKLIST.md) → cho phép next/image phục vụ SVG.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
