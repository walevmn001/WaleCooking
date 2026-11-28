/**
 * Resolve DNS + xác minh IP (I2.3, lớp L3) — "resolve-once".
 *
 * Nguyên tắc:
 * - Resolve **một lần** lấy **toàn bộ** A/AAAA records.
 * - Kiểm **mọi** địa chỉ theo L2; chỉ khi TẤT CẢ hợp lệ mới đi tiếp.
 * - Không resolve lại lần hai (tránh TOCTOU/DNS rebinding) — địa chỉ đã chọn
 *   được truyền xuống tầng kết nối để **pin** (xem `pinned-request.ts`).
 *
 * `DnsResolver` là cổng để tiêm resolver giả trong test (không cần DNS thật).
 */

import { lookup as systemLookup } from "node:dns/promises";
import { isIP } from "node:net";

import { normalizeHostname } from "./hostname";
import { classifyIp, type IpFamily } from "./ip";

export interface ResolvedRecords {
  ipv4: string[];
  ipv6: string[];
}

/** Cổng resolve DNS (tiêm được để test rebinding/mixed records). */
export interface DnsResolver {
  resolveAll(hostname: string): Promise<ResolvedRecords>;
}

/** Resolver mặc định dùng resolver hệ thống (`getaddrinfo` qua `node:dns`). */
export class SystemDnsResolver implements DnsResolver {
  async resolveAll(hostname: string): Promise<ResolvedRecords> {
    const records = await systemLookup(hostname, { all: true });
    const ipv4: string[] = [];
    const ipv6: string[] = [];
    for (const record of records) {
      if (record.family === 4) ipv4.push(record.address);
      else if (record.family === 6) ipv6.push(record.address);
    }
    return { ipv4, ipv6 };
  }
}

/** Lý do xác minh DNS thất bại — mã AN TOÀN (không lộ chi tiết resolver). */
export type DnsVerificationFailureReason = "DNS_FAILED" | "NO_ADDRESSES" | "UNSAFE_ADDRESS";

/** Đích đã xác minh an toàn để kết nối. */
export interface VerifiedTarget {
  hostname: string;
  /** IP đã chọn (đã kiểm an toàn). */
  address: string;
  family: IpFamily;
  /** Toàn bộ địa chỉ trả về (đều đã qua kiểm). */
  allAddresses: string[];
}

export type DnsVerificationResult =
  | { ok: true; target: VerifiedTarget }
  | { ok: false; reason: DnsVerificationFailureReason };

/**
 * Resolve một lần rồi xác minh toàn bộ địa chỉ. Bất kỳ địa chỉ nào không an toàn
 * ⇒ **từ chối toàn bộ** (không thử địa chỉ khác). IPv4 được ưu tiên chọn trước.
 */
export async function resolveAndVerify(
  hostname: string,
  resolver: DnsResolver,
): Promise<DnsVerificationResult> {
  const host = normalizeHostname(hostname);
  if (host === "") return { ok: false, reason: "NO_ADDRESSES" };

  // IP literal (đã được validator kiểm ở L2; vẫn kiểm lại để phòng thủ nhiều lớp).
  if (isIP(host) !== 0) {
    const classification = classifyIp(host);
    if (!classification || classification.blocked) return { ok: false, reason: "UNSAFE_ADDRESS" };
    return {
      ok: true,
      target: {
        hostname: host,
        address: classification.ip,
        family: classification.family,
        allAddresses: [classification.ip],
      },
    };
  }

  let records: ResolvedRecords;
  try {
    records = await resolver.resolveAll(host);
  } catch {
    return { ok: false, reason: "DNS_FAILED" };
  }

  const addresses = [...records.ipv4, ...records.ipv6];
  if (addresses.length === 0) return { ok: false, reason: "NO_ADDRESSES" };

  for (const address of addresses) {
    const classification = classifyIp(address);
    if (!classification || classification.blocked) return { ok: false, reason: "UNSAFE_ADDRESS" };
  }

  const chosen = addresses[0];
  const classification = classifyIp(chosen);
  if (!classification) return { ok: false, reason: "UNSAFE_ADDRESS" };

  return {
    ok: true,
    target: {
      hostname: host,
      address: classification.ip,
      family: classification.family,
      allAddresses: addresses,
    },
  };
}
