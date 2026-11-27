"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

/** Error boundary toàn cục. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="flex min-h-dvh items-center">
      <Container className="py-16">
        <ErrorState
          title="Đã xảy ra lỗi"
          description="Rất tiếc, trang này gặp sự cố khi tải. Bạn có thể thử lại."
          action={
            <Button variant="primary" size="lg" onClick={reset}>
              Thử lại
            </Button>
          }
        />
        {error.digest ? (
          <p className="mt-4 text-center text-caption text-ink-subtle">
            Mã lỗi: {error.digest}
          </p>
        ) : null}
      </Container>
    </main>
  );
}
