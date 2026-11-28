-- P18 (giải quyết B-P06-02): thêm cột băm mật khẩu cho đăng nhập Credentials.
-- Chỉ tài khoản quản trị (admin/editor) được cấp mật khẩu; KHÔNG lưu mật khẩu thô.
-- Giá trị là chuỗi băm scrypt có salt (xem lib/auth/password.ts), định dạng:
--   scrypt$<N>$<r>$<p>$<saltBase64>$<hashBase64>
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
