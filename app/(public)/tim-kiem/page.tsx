import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Tìm kiếm" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <PlaceholderPage
      title="Tìm kiếm"
      description={
        q
          ? `Chức năng tìm kiếm cho từ khoá “${q}” sẽ được triển khai ở phase sau.`
          : "Chức năng tìm kiếm công thức sẽ được triển khai ở phase sau."
      }
      phase="P06"
    />
  );
}
