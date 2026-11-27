import { LoadingState } from "@/components/ui/loading-state";
import { Container } from "@/components/layout/container";

export default function Loading() {
  return (
    <Container className="py-16">
      <LoadingState message="Đang tải nội dung…" />
    </Container>
  );
}
