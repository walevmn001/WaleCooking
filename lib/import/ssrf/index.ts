/**
 * Barrel SSRF (I2.3) — validator + tiện ích IP/hostname.
 * Implementation của guard SSRF; KHÔNG nằm trong barrel contract `lib/import/index.ts`.
 */

export { SsrfUrlValidator } from "./url-validator";
export { classifyIp, isBlockedIp, type IpClassification, type IpFamily } from "./ip";
export { isDeniedHostname, normalizeHostname, registrableDomain } from "./hostname";
