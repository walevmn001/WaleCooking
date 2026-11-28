/**
 * Phân loại địa chỉ IP (I2.3, lớp L2) — dùng `node:net.isIP` + so khớp CIDR.
 *
 * KHÔNG dùng regex/kiểm chuỗi đơn giản để quyết định an toàn; mọi địa chỉ được
 * chuyển về số nguyên (IPv4: uint32; IPv6: BigInt 128-bit) rồi so khớp dải IANA.
 *
 * Bất biến: `blocked === true` ⇒ TUYỆT ĐỐI không được kết nối tới địa chỉ đó.
 */

import { isIP } from "node:net";

export type IpFamily = 4 | 6;

export interface IpClassification {
  /** Địa chỉ đã chuẩn hoá (bỏ ngoặc IPv6, bỏ zone id). */
  ip: string;
  family: IpFamily;
  /** `true` khi thuộc dải cấm (private/loopback/link-local/reserved/multicast…). */
  blocked: boolean;
  /** Nhóm dải (tên rút gọn IANA) khi bị chặn; `null` khi là địa chỉ public. */
  reason: string | null;
}

/** Dải IPv4 bị cấm (I2.1 `SSRF_SECURITY_DESIGN.md` §L2). */
const IPV4_RANGES: ReadonlyArray<readonly [string, number, string]> = [
  ["0.0.0.0", 8, "this_network"],
  ["10.0.0.0", 8, "private"],
  ["100.64.0.0", 10, "cgnat"],
  ["127.0.0.0", 8, "loopback"],
  ["169.254.0.0", 16, "link_local"],
  ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "ietf_protocol"],
  ["192.0.2.0", 24, "documentation"],
  ["192.88.99.0", 24, "6to4_relay"],
  ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "benchmark"],
  ["198.51.100.0", 24, "documentation"],
  ["203.0.113.0", 24, "documentation"],
  ["224.0.0.0", 4, "multicast"],
  ["240.0.0.0", 4, "reserved"],
];

/** Dải IPv6 bị cấm (IPv4-mapped/NAT64 xử lý riêng — giải nén phần IPv4 nhúng). */
const IPV6_RANGES: ReadonlyArray<readonly [string, number, string]> = [
  ["::", 128, "unspecified"],
  ["::1", 128, "loopback"],
  ["::", 96, "ipv4_compatible"],
  ["100::", 64, "discard_only"],
  ["2001::", 23, "ietf_protocol"], // bao gồm Teredo 2001::/32
  ["2001:db8::", 32, "documentation"],
  ["2002::", 16, "6to4"],
  ["3fff::", 20, "documentation"],
  ["5f00::", 16, "srv6"],
  ["fc00::", 7, "ula"],
  ["fe80::", 10, "link_local"],
  ["ff00::", 8, "multicast"],
];

/** Chuẩn hoá literal: bỏ ngoặc IPv6 và zone id (`%eth0`). */
function normalizeLiteral(raw: string): string {
  let ip = raw.trim().toLowerCase();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  const pct = ip.indexOf("%");
  if (pct !== -1) ip = ip.slice(0, pct);
  return ip;
}

function ipv4ToUint(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = ((value << 8) | n) >>> 0;
  }
  return value >>> 0;
}

function inCidrV4(ip: number, base: string, prefix: number): boolean {
  const baseInt = ipv4ToUint(base);
  if (baseInt === null) return false;
  if (prefix <= 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return ((ip & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

/** Mở rộng IPv6 (kể cả dạng nhúng IPv4) thành 8 hextet. */
function expandV6(ip: string): string[] | null {
  let s = normalizeLiteral(ip);
  const lastColon = s.lastIndexOf(":");
  const tail = lastColon === -1 ? s : s.slice(lastColon + 1);
  if (tail.includes(".")) {
    const v4 = ipv4ToUint(tail);
    if (v4 === null) return null;
    const hi = ((v4 >>> 16) & 0xffff).toString(16);
    const lo = (v4 & 0xffff).toString(16);
    s = `${s.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  if (s.includes("::")) {
    const idx = s.indexOf("::");
    const left = s.slice(0, idx);
    const right = s.slice(idx + 2);
    const head = left === "" ? [] : left.split(":");
    const tailParts = right === "" ? [] : right.split(":");
    const missing = 8 - head.length - tailParts.length;
    if (missing < 1) return null;
    return [...head, ...Array<string>(missing).fill("0"), ...tailParts];
  }

  const parts = s.split(":");
  if (parts.length !== 8) return null;
  return parts;
}

function v6ToBigInt(ip: string): bigint | null {
  const parts = expandV6(ip);
  if (!parts) return null;
  let big = 0n;
  for (const part of parts) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
    big = (big << 16n) | BigInt(parseInt(part, 16));
  }
  return big;
}

function inCidrV6(ip: bigint, base: string, prefix: number): boolean {
  const baseInt = v6ToBigInt(base);
  if (baseInt === null) return false;
  if (prefix <= 0) return true;
  const shift = BigInt(128 - prefix);
  return ip >> shift === baseInt >> shift;
}

function blockReasonV4(ip: number): string | null {
  for (const [base, prefix, label] of IPV4_RANGES) {
    if (inCidrV4(ip, base, prefix)) return label;
  }
  return null;
}

/**
 * Phân loại một literal IP. Trả `null` nếu chuỗi KHÔNG phải IP hợp lệ
 * (khi đó phải xử lý như hostname, KHÔNG coi là an toàn).
 */
export function classifyIp(raw: string): IpClassification | null {
  const ip = normalizeLiteral(raw);
  const family = isIP(ip);

  if (family === 4) {
    const n = ipv4ToUint(ip);
    if (n === null) return null;
    const reason = blockReasonV4(n);
    return { ip, family: 4, blocked: reason !== null, reason };
  }

  if (family === 6) {
    const big = v6ToBigInt(ip);
    if (big === null) return null;

    // IPv4-mapped (::ffff:0:0/96) và NAT64 (64:ff9b::/96): giải nén IPv4 nhúng.
    if (inCidrV6(big, "::ffff:0:0", 96) || inCidrV6(big, "64:ff9b::", 96)) {
      const embedded = Number(big & 0xffffffffn);
      const reason = blockReasonV4(embedded);
      return { ip, family: 6, blocked: reason !== null, reason };
    }

    for (const [base, prefix, label] of IPV6_RANGES) {
      if (inCidrV6(big, base, prefix)) {
        return { ip, family: 6, blocked: true, reason: label };
      }
    }
    return { ip, family: 6, blocked: false, reason: null };
  }

  return null;
}

/** Tiện ích: literal này có phải IP bị cấm không (không phải IP ⇒ `false`). */
export function isBlockedIp(raw: string): boolean {
  const classification = classifyIp(raw);
  return classification !== null && classification.blocked;
}
