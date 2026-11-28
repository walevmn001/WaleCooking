/**
 * I2.3 — SECURITY test cho SafeFetcher (M5): redirect protection + response limits.
 *
 * Chia hai nhóm:
 *  - INTEGRATION (socket thật): server cục bộ 127.0.0.1; chứng minh redirect được
 *    kiểm lại + pin lại MỖI hop, Host header giữ hostname, không gửi header nhạy cảm,
 *    và các trần tài nguyên (body/nén/content-type/timeout) được enforce thực tế.
 *  - LOGIC (tiêm requester + resolver giả): các nhánh SSRF không thể dựng bằng socket
 *    (redirect tới IP nội bộ, hạ cấp HTTPS, thiếu Location, DNS fail).
 *
 * KHÔNG dùng website bên thứ ba.
 */

import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import zlib from "node:zlib";

import { afterAll, describe, expect, it } from "vitest";

import type { DnsResolver } from "@/lib/import/ssrf/dns";
import {
  pinnedRequest,
  type PinnedRequestOptions,
  type PinnedRequestResult,
} from "@/lib/import/ssrf/pinned-request";
import {
  SafeFetcherImpl,
  baseContentType,
  decodeBody,
  type SafeFetcherDeps,
  type TargetResolver,
} from "@/lib/import/ssrf/safe-fetcher";
import { SsrfUrlValidator } from "@/lib/import/ssrf/url-validator";

const servers: http.Server[] = [];
afterAll(() => {
  for (const server of servers) server.close();
});

async function startServer(handler: http.RequestListener): Promise<number> {
  const server = http.createServer(handler);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return (server.address() as AddressInfo).port;
}

/** Đích "đã xác minh" cho harness cục bộ (trỏ về loopback). */
const loopbackTarget: TargetResolver = async (hostname) => ({
  ok: true,
  target: { hostname, address: "127.0.0.1", family: 4, allAddresses: ["127.0.0.1"] },
});

function integrationFetcher(port: number, overrides: Partial<SafeFetcherDeps> = {}) {
  return new SafeFetcherImpl({
    validator: new SsrfUrlValidator({ allowedPorts: [port] }),
    targetResolver: loopbackTarget,
    requester: pinnedRequest,
    requireHttps: false,
    ...overrides,
  });
}

// ---------- INTEGRATION (socket thật) ----------

describe("I2.3 M5 — SafeFetcher integration (socket thật)", () => {
  it("theo redirect tương đối: kiểm lại + pin lại, trả tài liệu cuối", async () => {
    const port = await startServer((req, res) => {
      if (req.url === "/start") {
        res.writeHead(302, { location: "/final" });
        res.end();
      } else {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end("<h1>ok</h1>");
      }
    });
    const result = await integrationFetcher(port).fetch({
      url: `http://recipe.test:${port}/start`,
      maxBytes: 10000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe(200);
    expect(result.html).toContain("ok");
    expect(result.finalUrl).toContain("/final");
    expect(result.redirectChain).toHaveLength(1);
  });

  it("redirect khác domain: KHÔNG gửi Cookie/Authorization; giữ Host = hostname đích", async () => {
    const captured: http.IncomingHttpHeaders[] = [];
    const port = await startServer((req, res) => {
      captured.push({ ...req.headers });
      if (req.url === "/start") {
        res.writeHead(302, { location: `http://other.test:${port}/final` });
        res.end();
      } else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("done");
      }
    });
    const result = await integrationFetcher(port).fetch({
      url: `http://recipe.test:${port}/start`,
      maxBytes: 10000,
    });
    expect(result.ok).toBe(true);
    expect(captured).toHaveLength(2);
    for (const headers of captured) {
      expect(headers["cookie"]).toBeUndefined();
      expect(headers["authorization"]).toBeUndefined();
      expect(headers["proxy-authorization"]).toBeUndefined();
    }
    // Host trên hop thứ hai là hostname đích (không phải IP).
    expect(String(captured[1]?.host)).toContain("other.test");
  });

  it("vượt số redirect cho phép ⇒ TOO_MANY_REDIRECTS", async () => {
    const port = await startServer((req, res) => {
      const n = Number(new URL(req.url ?? "/", "http://x").pathname.slice(1));
      res.writeHead(302, { location: `/${n + 1}` });
      res.end();
    });
    const result = await integrationFetcher(port, { maxRedirects: 5 }).fetch({
      url: `http://loop.test:${port}/0`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TOO_MANY_REDIRECTS");
  });

  it("redirect quay vòng ⇒ REDIRECT_LOOP", async () => {
    const port = await startServer((req, res) => {
      res.writeHead(302, { location: req.url === "/a" ? "/b" : "/a" });
      res.end();
    });
    const result = await integrationFetcher(port).fetch({ url: `http://loop.test:${port}/a` });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("REDIRECT_LOOP");
  });

  it("body vượt trần byte ⇒ BODY_TOO_LARGE (abort)", async () => {
    const port = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("a".repeat(20000));
    });
    const result = await integrationFetcher(port).fetch({
      url: `http://big.test:${port}/`,
      maxBytes: 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("BODY_TOO_LARGE");
  });

  it("compression bomb (nén nhỏ, giải nén lớn) ⇒ DECOMPRESSION_LIMIT", async () => {
    const bomb = zlib.gzipSync(Buffer.from("a".repeat(1_000_000)));
    expect(bomb.length).toBeLessThan(100_000);
    const port = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" });
      res.end(bomb);
    });
    const result = await integrationFetcher(port).fetch({
      url: `http://bomb.test:${port}/`,
      maxBytes: 100_000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("DECOMPRESSION_LIMIT");
  });

  it("content-type ngoài allow-list ⇒ UNSUPPORTED_CONTENT_TYPE", async () => {
    const port = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
    });
    const result = await integrationFetcher(port).fetch({ url: `http://data.test:${port}/` });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSUPPORTED_CONTENT_TYPE");
  });

  it("trang trả mã 4xx ⇒ HTTP_ERROR_STATUS", async () => {
    const port = await startServer((_req, res) => {
      res.writeHead(404, { "content-type": "text/html" });
      res.end("not found");
    });
    const result = await integrationFetcher(port).fetch({ url: `http://gone.test:${port}/` });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("HTTP_ERROR_STATUS");
  });

  it("server không phản hồi ⇒ TIMEOUT (fail closed)", async () => {
    const port = await startServer(() => {
      /* không bao giờ trả lời */
    });
    const result = await integrationFetcher(port).fetch({
      url: `http://slow.test:${port}/`,
      timeoutMs: 250,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TIMEOUT");
  });
});

// ---------- LOGIC (requester/resolver tiêm) ----------

const okResponse = (status: number, headers: http.IncomingHttpHeaders): PinnedRequestResult => ({
  ok: true,
  response: { status, headers, body: Buffer.alloc(0), remoteAddress: "8.8.8.8" },
});

describe("I2.3 M5 — SafeFetcher logic (nhánh SSRF)", () => {
  it("redirect tới hostname phân giải về IP nội bộ ⇒ UNSAFE_ADDRESS", async () => {
    const resolver: DnsResolver = {
      async resolveAll(hostname) {
        return hostname === "a.test" ? { ipv4: ["8.8.8.8"], ipv6: [] } : { ipv4: ["10.0.0.1"], ipv6: [] };
      },
    };
    const requester = async (): Promise<PinnedRequestResult> =>
      okResponse(302, { location: "http://internal.test/" });
    const fetcher = new SafeFetcherImpl({ resolver, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://a.test/start" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSAFE_ADDRESS");
  });

  it("redirect hạ cấp HTTPS → HTTP bị chặn ⇒ URL_REJECTED", async () => {
    const anyTarget: TargetResolver = async (hostname) => ({
      ok: true,
      target: { hostname, address: "8.8.8.8", family: 4, allAddresses: ["8.8.8.8"] },
    });
    const requester = async (): Promise<PinnedRequestResult> =>
      okResponse(302, { location: "http://a.test/next" });
    const fetcher = new SafeFetcherImpl({ targetResolver: anyTarget, requester, requireHttps: true });
    const result = await fetcher.fetch({ url: "https://a.test/start" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("URL_REJECTED");
  });

  it("3xx thiếu Location ⇒ HTTP_ERROR_STATUS", async () => {
    const anyTarget: TargetResolver = async (hostname) => ({
      ok: true,
      target: { hostname, address: "8.8.8.8", family: 4, allAddresses: ["8.8.8.8"] },
    });
    const requester = async (): Promise<PinnedRequestResult> => okResponse(301, {});
    const fetcher = new SafeFetcherImpl({ targetResolver: anyTarget, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://a.test/start" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("HTTP_ERROR_STATUS");
  });

  it("resolver lỗi ⇒ DNS_FAILED (fail closed)", async () => {
    const targetResolver: TargetResolver = async () => ({ ok: false, reason: "DNS_FAILED" });
    const fetcher = new SafeFetcherImpl({ targetResolver, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://a.test/start" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("DNS_FAILED");
  });

  it("request gửi đi KHÔNG chứa header nhạy cảm (L10)", async () => {
    const seen: PinnedRequestOptions[] = [];
    const anyTarget: TargetResolver = async (hostname) => ({
      ok: true,
      target: { hostname, address: "8.8.8.8", family: 4, allAddresses: ["8.8.8.8"] },
    });
    const requester = async (options: PinnedRequestOptions): Promise<PinnedRequestResult> => {
      seen.push(options);
      return {
        ok: true,
        response: {
          status: 200,
          headers: { "content-type": "text/html" },
          body: Buffer.from("<p>ok</p>"),
          remoteAddress: "8.8.8.8",
        },
      };
    };
    const fetcher = new SafeFetcherImpl({ targetResolver: anyTarget, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://a.test/" });
    expect(result.ok).toBe(true);
    const headers = seen[0]?.headers ?? {};
    const keys = Object.keys(headers).map((key) => key.toLowerCase());
    expect(keys).not.toContain("cookie");
    expect(keys).not.toContain("authorization");
    expect(headers["accept-encoding"]).toBe("identity");
  });
});

// ---------- UNIT: helpers ----------

describe("I2.3 M5 — decodeBody / baseContentType", () => {
  it("identity: trả nguyên trạng nếu trong trần", () => {
    const out = decodeBody(Buffer.from("hello"), undefined, 100);
    expect(out.ok && out.body.toString()).toBe("hello");
  });

  it("identity vượt trần ⇒ DECOMPRESSION_LIMIT", () => {
    const out = decodeBody(Buffer.from("a".repeat(50)), "identity", 10);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("DECOMPRESSION_LIMIT");
  });

  it("gzip hợp lệ: giải nén đúng", () => {
    const raw = zlib.gzipSync(Buffer.from("nội dung"));
    const out = decodeBody(raw, "gzip", 1000);
    expect(out.ok && out.body.toString("utf-8")).toBe("nội dung");
  });

  it("gzip vượt trần sau giải nén ⇒ DECOMPRESSION_LIMIT", () => {
    const raw = zlib.gzipSync(Buffer.from("a".repeat(100_000)));
    const out = decodeBody(raw, "gzip", 1000);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("DECOMPRESSION_LIMIT");
  });

  it("encoding không hỗ trợ ⇒ UNSUPPORTED_CONTENT_TYPE (fail closed)", () => {
    const out = decodeBody(Buffer.from("x"), "zstd", 1000);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("UNSUPPORTED_CONTENT_TYPE");
  });

  it("baseContentType bỏ tham số charset", () => {
    expect(baseContentType("Text/HTML; charset=UTF-8")).toBe("text/html");
    expect(baseContentType(undefined)).toBe("");
  });
});
