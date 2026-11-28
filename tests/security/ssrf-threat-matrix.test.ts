/**
 * I2.3 — MA TRẬN MỐI ĐE DỌA SSRF (M6): ánh xạ từng dòng của bảng §4.6 → test.
 *
 * Gồm cả kiểm chứng TÍCH HỢP (socket thật, đo kết nối thực tế) và kiểm chứng
 * tầng validate/resolve/orchestrate. KHÔNG dùng website bên thứ ba.
 *
 * | Nhóm                              | Kết quả bắt buộc | Test |
 * |-----------------------------------|------------------|------|
 * | Public IPv4 / IPv6                | Cho phép         | "cho phép public" |
 * | Localhost / loopback              | Block            | "chặn loopback" |
 * | Private IP                        | Block            | "chặn private" |
 * | Link-local                        | Block            | "chặn link-local" |
 * | Metadata IP/hostname              | Block            | "chặn metadata" |
 * | IPv4-mapped IPv6 nguy hiểm        | Block            | "chặn IPv4-mapped" |
 * | DNS mixed public/private          | Block            | "mixed" |
 * | DNS rebinding                     | Không kết nối IP chưa xác minh | "rebinding" |
 * | Redirect tới private IP           | Block            | "redirect private" |
 * | Redirect loop                     | Block            | "loop" |
 * | Port không cho phép               | Block            | "port" |
 * | URL chứa credentials              | Block            | "credentials" |
 * | Timeout                           | Fail closed      | "timeout" |
 * | Body vượt giới hạn                | Abort            | "body" |
 * | TLS certificate không hợp lệ      | Block            | "TLS untrusted" |
 */

import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { resolveAndVerify, type DnsResolver } from "@/lib/import/ssrf/dns";
import { pinnedRequest, type PinnedRequestResult } from "@/lib/import/ssrf/pinned-request";
import { SafeFetcherImpl } from "@/lib/import/ssrf/safe-fetcher";
import { SsrfUrlValidator } from "@/lib/import/ssrf/url-validator";

const validator = new SsrfUrlValidator();
const servers: Array<http.Server | https.Server> = [];
let tlsDir: string | null = null;

afterAll(() => {
  for (const server of servers) server.close();
  if (tlsDir) rmSync(tlsDir, { recursive: true, force: true });
});

async function startHttp(handler: http.RequestListener): Promise<number> {
  const server = http.createServer(handler);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return (server.address() as AddressInfo).port;
}

function fakeResolver(records: { ipv4?: string[]; ipv6?: string[] }): DnsResolver {
  return {
    async resolveAll() {
      return { ipv4: records.ipv4 ?? [], ipv6: records.ipv6 ?? [] };
    },
  };
}

function tlsMaterial(): { key: string; cert: string } | null {
  try {
    tlsDir = mkdtempSync(join(tmpdir(), "wale-matrix-tls-"));
    const configPath = join(tlsDir, "openssl.cnf");
    const keyPath = join(tlsDir, "key.pem");
    const certPath = join(tlsDir, "cert.pem");
    writeFileSync(
      configPath,
      ["[req]", "distinguished_name=dn", "x509_extensions=v3", "prompt=no", "[dn]", "CN=recipe.test", "[v3]", "subjectAltName=DNS:recipe.test", "basicConstraints=CA:TRUE", ""].join("\n"),
    );
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", keyPath, "-out", certPath, "-days", "1", "-config", configPath], { stdio: "ignore" });
    return { key: readFileSync(keyPath, "utf8"), cert: readFileSync(certPath, "utf8") };
  } catch {
    return null;
  }
}

// ---------- Cho phép: public ----------

describe("I2.3 M6 — cho phép public (đáp ứng policy)", () => {
  it("public IPv4 & IPv6 hợp lệ ⇒ cho phép", () => {
    expect(validator.validate("http://93.184.216.34/").ok).toBe(true);
    expect(validator.validate("https://[2606:2800:220:1:248:1893:25c8:1946]/").ok).toBe(true);
  });

  it("resolveAndVerify chấp nhận địa chỉ public và chọn IP an toàn", async () => {
    const result = await resolveAndVerify("example.com", fakeResolver({ ipv4: ["93.184.216.34"] }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.target.address).toBe("93.184.216.34");
  });
});

// ---------- Chặn: tĩnh (validator) ----------

describe("I2.3 M6 — chặn IP/hostname nguy hiểm (validator L1/L2/L5/L7)", () => {
  it("chặn loopback (localhost, 127.0.0.1, ::1)", () => {
    expect(validator.validate("http://localhost/").ok).toBe(false);
    expect(validator.validate("http://127.0.0.1/").ok).toBe(false);
    expect(validator.validate("http://[::1]/").ok).toBe(false);
  });

  it("chặn private IPv4/IPv6 (10/172.16/192.168, fc00::)", () => {
    expect(validator.validate("http://10.0.0.5/").ok).toBe(false);
    expect(validator.validate("http://192.168.1.1/").ok).toBe(false);
    expect(validator.validate("http://172.16.0.1/").ok).toBe(false);
    expect(validator.validate("http://[fc00::1]/").ok).toBe(false);
  });

  it("chặn link-local (169.254.0.0/16, fe80::/10)", () => {
    expect(validator.validate("http://169.254.1.1/").ok).toBe(false);
    expect(validator.validate("http://[fe80::1]/").ok).toBe(false);
  });

  it("chặn metadata IP & hostname", () => {
    expect(validator.validate("http://169.254.169.254/latest/meta-data/").ok).toBe(false);
    expect(validator.validate("http://metadata.google.internal/").ok).toBe(false);
  });

  it("chặn IPv4-mapped IPv6 nguy hiểm (::ffff:127.0.0.1)", () => {
    expect(validator.validate("http://[::ffff:127.0.0.1]/").ok).toBe(false);
  });

  it("chặn port ngoài allow-list", () => {
    const result = validator.validate("http://example.com:8080/");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("DISALLOWED_PORT");
  });

  it("chặn URL chứa credentials", () => {
    const result = validator.validate("http://user:secret@example.com/");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("URL_HAS_CREDENTIALS");
  });
});

// ---------- Chặn: DNS mixed ----------

describe("I2.3 M6 — DNS", () => {
  it("mixed public/private ⇒ chặn toàn bộ", async () => {
    const result = await resolveAndVerify("rebind.test", fakeResolver({ ipv4: ["93.184.216.34", "10.0.0.1"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSAFE_ADDRESS");
  });

  it("DNS rebinding: resolve đúng 1 lần, kết nối tới IP đã xác minh (không IP thứ hai)", async () => {
    let calls = 0;
    const resolver: DnsResolver = {
      async resolveAll() {
        calls += 1;
        return calls === 1 ? { ipv4: ["8.8.8.8"], ipv6: [] } : { ipv4: ["127.0.0.1"], ipv6: [] };
      },
    };
    const addresses: string[] = [];
    const requester = async (options: { address: string }): Promise<PinnedRequestResult> => {
      addresses.push(options.address);
      return {
        ok: true,
        response: { status: 200, headers: { "content-type": "text/html" }, body: Buffer.from("ok"), remoteAddress: options.address },
      };
    };
    const fetcher = new SafeFetcherImpl({ resolver, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://rebind.test/" });
    expect(result.ok).toBe(true);
    expect(calls).toBe(1); // không resolve lần hai
    expect(addresses).toEqual(["8.8.8.8"]); // tới IP đã xác minh, KHÔNG phải 127.0.0.1
  });
});

// ---------- Chặn: redirect ----------

describe("I2.3 M6 — redirect", () => {
  it("redirect tới hostname phân giải về IP private ⇒ chặn", async () => {
    const resolver: DnsResolver = {
      async resolveAll(hostname) {
        return hostname === "a.test" ? { ipv4: ["8.8.8.8"], ipv6: [] } : { ipv4: ["192.168.0.1"], ipv6: [] };
      },
    };
    const requester = async (): Promise<PinnedRequestResult> => ({
      ok: true,
      response: { status: 302, headers: { location: "http://internal.test/" }, body: Buffer.alloc(0), remoteAddress: "8.8.8.8" },
    });
    const fetcher = new SafeFetcherImpl({ resolver, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://a.test/start" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSAFE_ADDRESS");
  });

  it("redirect quay vòng ⇒ chặn", async () => {
    const target = async (hostname: string) => ({
      ok: true as const,
      target: { hostname, address: "8.8.8.8", family: 4 as const, allAddresses: ["8.8.8.8"] },
    });
    const requester = async (options: { path: string }): Promise<PinnedRequestResult> => ({
      ok: true,
      response: {
        status: 302,
        headers: { location: options.path === "/a" ? "/b" : "/a" },
        body: Buffer.alloc(0),
        remoteAddress: "8.8.8.8",
      },
    });
    const fetcher = new SafeFetcherImpl({ targetResolver: target, requester, requireHttps: false });
    const result = await fetcher.fetch({ url: "http://loop.test/a" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("REDIRECT_LOOP");
  });
});

// ---------- Chặn: resource limits (socket thật) ----------

describe("I2.3 M6 — resource limits (socket thật)", () => {
  const loopbackTarget = async (hostname: string) => ({
    ok: true as const,
    target: { hostname, address: "127.0.0.1", family: 4 as const, allAddresses: ["127.0.0.1"] },
  });

  function fetcher(port: number) {
    return new SafeFetcherImpl({
      validator: new SsrfUrlValidator({ allowedPorts: [port] }),
      targetResolver: loopbackTarget,
      requester: pinnedRequest,
      requireHttps: false,
    });
  }

  it("timeout ⇒ fail closed", async () => {
    const port = await startHttp(() => {
      /* không phản hồi */
    });
    const result = await fetcher(port).fetch({ url: `http://slow.test:${port}/`, timeoutMs: 250 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TIMEOUT");
  });

  it("body vượt trần ⇒ abort", async () => {
    const port = await startHttp((_req, res) => {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("a".repeat(20000));
    });
    const result = await fetcher(port).fetch({ url: `http://big.test:${port}/`, maxBytes: 1024 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("BODY_TOO_LARGE");
  });
});

// ---------- Chặn: TLS không hợp lệ (socket thật) ----------

describe("I2.3 M6 — TLS", () => {
  it("chứng chỉ không tin cậy (self-signed, không có CA) ⇒ chặn", async () => {
    const material = tlsMaterial();
    if (!material) {
      console.warn("[security] bỏ qua test TLS: thiếu openssl.");
      return;
    }
    const server = https.createServer({ key: material.key, cert: material.cert }, (_req, res) => res.end("x"));
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;

    const result = await pinnedRequest({
      hostname: "recipe.test",
      address: "127.0.0.1",
      family: 4,
      port,
      protocol: "https:",
      path: "/",
      timeoutMs: 3000,
      maxBytes: 4096,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TLS_FAILED");
  });
});
