import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Trạng thái đang tải cho danh sách công thức (P07 §16). */
export default function RecipesLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton shape="text" className="h-5 w-40" />
      <div className="mt-6 flex flex-col gap-2">
        <Skeleton shape="text" className="h-9 w-56" />
        <Skeleton shape="text" className="h-5 w-full max-w-prose" />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
      <div
        className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Đang tải danh sách công thức…</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton shape="text" className="h-5 w-3/4" />
            <Skeleton shape="text" className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Container>
  );
}
