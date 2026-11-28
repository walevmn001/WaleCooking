"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { FormError, FormField } from "@/components/forms/form-field";
import { Input } from "@/components/forms/input";
import { Button } from "@/components/ui/button";

/**
 * Form đăng nhập quản trị (P18).
 *
 * Gọi `signIn("credentials")` của Auth.js. Chỉ tài khoản nhân sự quản trị (admin/editor)
 * đã được provisioning mới đăng nhập được — KHÔNG có đăng ký công khai.
 */
export function AdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        // Thông điệp chung: không tiết lộ tài khoản có tồn tại hay không.
        setError("Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền quản trị.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Không thể đăng nhập lúc này. Vui lòng thử lại sau.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField label="Email" required>
        <Input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Mật khẩu" required>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </FormField>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" loading={pending} fullWidth>
        Đăng nhập
      </Button>
    </form>
  );
}
