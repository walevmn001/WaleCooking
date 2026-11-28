import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "@/styles/globals.css";
import { siteConfig } from "@/lib/constants/site";
import { ToastProvider } from "@/components/feedback/toast";

/* Font thương hiệu P03: Baloo 2 (heading) + Nunito (body), tải bằng next/font. */
const baloo = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${siteConfig.name} — Cẩm nang nấu ăn`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: { icon: "/assets/brand/favicon.svg" },
  applicationName: siteConfig.name,
};

export const viewport: Viewport = {
  themeColor: "#FFF9F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="min-h-dvh bg-background text-ink antialiased">
        <a href="#main-content" className="skip-link">
          Bỏ qua tới nội dung chính
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
