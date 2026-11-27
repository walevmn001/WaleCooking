import { ShieldAlert } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";

export interface AdminAccessNoticeProps {
  /** Tiêu đề khu vực cần quyền truy cập. */
  title?: string;
}

/**
 * AdminAccessNotice — thông báo khi người dùng không có quyền vào khu quản trị.
 *
 * Auth.js CHƯA được nối trong phạm vi P06/P07 (xem lib/auth/session.ts); do đó mọi
 * khách truy cập đều không có quyền. KHÔNG giả lập người dùng đã đăng nhập.
 */
export function AdminAccessNotice({ title = "Khu vực quản trị" }: AdminAccessNoticeProps) {
  return (
    <Container size="narrow" className="py-10">
      <div className="flex max-w-xl flex-col items-start gap-4 rounded-lg border border-line-subtle bg-surface p-6">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-chip-warning-bg text-chip-warning-text">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <Badge variant="warning">Yêu cầu quyền truy cập</Badge>
        <h1 className="text-h2 text-ink">{title}</h1>
        <p className="text-body text-ink-muted">
          Bạn cần đăng nhập bằng tài khoản có quyền biên tập (Editor) hoặc quản trị (Admin) để
          dùng chức năng này. Hiện tại hệ thống đăng nhập chưa được kích hoạt trong bản dựng này,
          nên khu vực quản trị tạm thời không khả dụng.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dang-nhap" appearance="button" variant="primary">
            Đăng nhập
          </Link>
          <Link href="/cong-thuc" appearance="button" variant="outline">
            Xem công thức công khai
          </Link>
        </div>
      </div>
    </Container>
  );
}
