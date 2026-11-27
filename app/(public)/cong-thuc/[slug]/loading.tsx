import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Trạng thái đang tải cho trang chi tiết công thức. */
export default function RecipeDetailLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton shape="text" className="h-5 w-56" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Đang tải công thức…</span>
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton shape="text" className="h-10 w-3/4" />
          <Skeleton shape="text" className="h-5 w-full" />
          <Skeleton shape="text" className="h-5 w-2/3" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} shape="text" className="h-6 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </Container>
  );
}
