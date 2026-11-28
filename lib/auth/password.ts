import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/**
 * Băm & kiểm tra mật khẩu (P18 — B-P06-02).
 *
 * Module chỉ dùng ở PHÍA SERVER (Auth.js authorize + script provisioning admin).
 * KHÔNG import từ client component. (Không đặt `server-only` để script CLI `tsx` dùng được.)
 *
 * - Dùng **scrypt** của Node (`node:crypto`) — KHÔNG thêm dependency ngoài, đã được
 *   kiểm chứng, chống brute-force tốt hơn hash nhanh (SHA-*).
 * - Định dạng lưu trữ (một dòng, tự mô tả tham số):
 *     `scrypt$<N>$<r>$<p>$<saltBase64>$<hashBase64>`
 * - Mỗi mật khẩu có **salt ngẫu nhiên riêng**; so sánh bằng `timingSafeEqual`.
 * - KHÔNG log mật khẩu; KHÔNG bao giờ trả về hash ra ngoài tầng xác thực.
 */

const PREFIX = "scrypt";
const COST = 16384; // N = 2^14 (≈16 MB bộ nhớ/lần băm)
const BLOCK_SIZE = 8; // r
const PARALLELIZATION = 1; // p
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Bọc `scrypt` callback thành Promise có kiểu rõ ràng.
 * (Không dùng `promisify` vì overload của `scrypt` không suy ra được tham số `options`.)
 */
function scrypt(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Băm mật khẩu thành chuỗi an toàn để lưu DB. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  })) as Buffer;

  return [
    PREFIX,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Kiểm tra mật khẩu với chuỗi băm đã lưu.
 * Trả về `false` (không ném lỗi) với mọi dữ liệu băm không hợp lệ → tránh lộ chi tiết.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelization = Number(parts[3]);
  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    cost <= 1 ||
    blockSize <= 0 ||
    parallelization <= 0
  ) {
    return false;
  }

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (salt.length === 0 || expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = (await scrypt(password, salt, expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
    })) as Buffer;
  } catch {
    return false;
  }

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
