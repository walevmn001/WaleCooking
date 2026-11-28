/**
 * Kiểm hostname (I2.3, lớp L5) — chặn hostname metadata/nội bộ và suy eTLD+1
 * (best-effort) để tra Source Registry.
 *
 * Deny-list này BỔ SUNG cho kiểm IP (L2): kể cả khi hostname chưa resolve được,
 * các tên nội bộ/metadata vẫn bị chặn ở tầng tĩnh.
 */

/** Hostname chính xác bị chặn. */
const DENIED_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "kubernetes.default",
]);

/** Hậu tố hostname bị chặn (so khớp theo nhãn, không phải substring tuỳ ý). */
const DENIED_SUFFIXES: readonly string[] = [
  ".localhost",
  ".local",
  ".localhost.localdomain",
  ".internal",
  ".cluster.local",
  ".home.arpa",
];

/** Hậu tố nhiều phần (public suffix) phổ biến — best-effort cho eTLD+1. */
const MULTI_LABEL_SUFFIXES: ReadonlySet<string> = new Set([
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.jp",
  "com.br",
  "com.vn",
  "co.kr",
  "co.in",
  "com.sg",
  "com.my",
  "co.id",
  "co.th",
  "co.nz",
  "co.za",
]);

/** Chuẩn hoá hostname: hạ chữ thường + bỏ dấu chấm cuối. */
export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, "");
}

/** `true` nếu hostname thuộc deny-list metadata/nội bộ (L5). */
export function isDeniedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (host === "") return true;
  if (DENIED_HOSTNAMES.has(host)) return true;
  return DENIED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** eTLD+1 best-effort (dùng tra Source Registry). */
export function registrableDomain(hostname: string): string {
  const host = normalizeHostname(hostname);
  const labels = host.split(".").filter((label) => label !== "");
  if (labels.length <= 2) return host;
  const last2 = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(last2)) return labels.slice(-3).join(".");
  return last2;
}
