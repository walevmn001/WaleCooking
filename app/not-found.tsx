import Image from "next/image";
import { Link } from "@/components/ui/link";
import { Container } from "@/components/layout/container";
import { SiteLogo } from "@/components/layout/site-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line-subtle">
        <Container size="wide" className="flex h-16 items-center">
          <SiteLogo variant="full" />
        </Container>
      </header>
      <main id="main-content" className="flex flex-1 items-center">
        <Container className="flex flex-col items-center gap-5 py-16 text-center">
          <Image
            src="/assets/illustrations/404.svg"
            alt=""
            aria-hidden="true"
            width={200}
            height={200}
            unoptimized
            className="size-40 sm:size-52"
          />
          <h1 className="text-h1 text-ink">Không tìm thấy trang</h1>
          <p className="max-w-prose text-body text-ink-muted">
            Trang bạn tìm không tồn tại hoặc đã được di chuyển.
          </p>
          <Link href="/" appearance="button" variant="primary" size="lg">
            Về trang chủ
          </Link>
        </Container>
      </main>
    </div>
  );
}
