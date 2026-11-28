/**
 * Barrel SSRF (I2.3) — validator + tiện ích IP/hostname + resolve/pin.
 * Implementation của guard SSRF; KHÔNG nằm trong barrel contract `lib/import/index.ts`.
 */

export { SsrfUrlValidator } from "./url-validator";
export { classifyIp, isBlockedIp, type IpClassification, type IpFamily } from "./ip";
export { isDeniedHostname, normalizeHostname, registrableDomain } from "./hostname";
export {
  SystemDnsResolver,
  resolveAndVerify,
  type DnsResolver,
  type DnsVerificationFailureReason,
  type DnsVerificationResult,
  type ResolvedRecords,
  type VerifiedTarget,
} from "./dns";
export {
  createPinnedLookup,
  pinnedRequest,
  type PinnedRequestFailure,
  type PinnedRequestOptions,
  type PinnedRequestResult,
  type PinnedResponse,
} from "./pinned-request";
export {
  SafeFetcherImpl,
  baseContentType,
  decodeBody,
  type PinnedRequester,
  type SafeFetcherDeps,
  type TargetResolver,
} from "./safe-fetcher";
