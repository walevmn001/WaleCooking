import type { Metadata } from "next";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-3">
        <Badge variant="warning">Chưa triển khai</Badge>
        <CardTitle as="h1" className="text-h2">
          Đăng nhập
        </CardTitle>
        <p className="text-body text-ink-muted">
          Chức năng xác thực (Auth.js) sẽ được triển khai ở phase sau. P05 chỉ dựng khung layout
          xác thực.
        </p>
      </CardBody>
    </Card>
  );
}
