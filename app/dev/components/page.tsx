import { notFound } from "next/navigation";
import { ComponentGallery } from "@/components/dev/component-gallery";

/**
 * Trang kiểm tra component — CHỈ tồn tại ở môi trường phát triển.
 * Trong production, route trả về 404 (không xuất hiện công khai).
 */
export default function ComponentGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ComponentGallery />;
}
