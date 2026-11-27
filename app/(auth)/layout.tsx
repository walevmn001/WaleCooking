import { Link } from "@/components/ui/link";
import { SiteLogo } from "@/components/layout/site-logo";

/** Layout xác thực — khung tối giản, không header/footer đầy đủ. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <SiteLogo variant="full" />
      <main id="main-content" className="w-full max-w-md">
        {children}
      </main>
      <Link href="/" appearance="inline" className="text-body-sm">
        Về trang chủ
      </Link>
    </div>
  );
}
