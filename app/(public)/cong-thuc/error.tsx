"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ErrorState } from "@/components/ui/error-state";
import { Container } from "@/components/layout/container";

/** Error boundary cho tuyến danh sách công thức. */
export default function RecipesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-8 sm:py-12">
      <ErrorState
        title="Chưa tải được danh sách công thức"
        description="Rất tiếc, kho công thức đang tạm thời không phản hồi. Vui lòng thử lại."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" onClick={reset}>
              Thử lại
            </Button>
            <Link href="/" appearance="button" variant="outline">
              Về trang chủ
            </Link>
          </div>
        }
      />
      {error.digest ? (
        <p className="mt-4 text-center text-caption text-ink-subtle">Mã lỗi: {error.digest}</p>
      ) : null}
    </Container>
  );
}
