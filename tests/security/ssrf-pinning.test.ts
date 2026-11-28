/**
 * I2.3 — INTEGRATION test cho DNS resolution + IP pinning (M4).
 *
 * Không dùng website bên thứ ba: chỉ server cục bộ + resolver giả tiêm được.
 * Mục tiêu: CHỨNG MINH bằng socket thật rằng
 *  (1) kết nối đi tới ĐÚNG IP đã pin (đo `remoteAddress` + phân biệt hai server),
 *  (2) HTTP client KHÔNG tự resolve lại hostname (hostname không có DNS vẫn kết nối được),
 *  (3) TLS/SNI vẫn dùng hostname gốc; cert sai hostname bị từ chối,
 *  (4) DNS mixed public/private ⇒ từ chối toàn bộ.
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
import { pinnedRequest } from "@/lib/import/ssrf/pinned-request";

interface SeenRequest {
  host: string | undefined;
  remote: string | undefined;
}

interface RunningServer {
  server: http.Server | https.Server;
  host: string;
  port: number;
  seen: SeenRequest[];
}

const openServers: Array<http.Server | https.Server> = [];

function track<T extends http.Server | https.Server>(server: T): T {
  openServers.push(server);
  return server;
}

async function startHttp(host: string): Promise<RunningServer> {
  const seen: SeenRequest[] = [];
  const server = track(
    http.createServer((req, res) => {
      seen.push({ host: req.headers.host, remote: req.socket.remoteAddress });
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`marker:${host}`);
    }),
  );
  server.listen(0, host);
  await once(server, "listening");
  return { server, host, port: (server.address() as AddressInfo).port, seen };
}

afterAll(() => {
  for (const server of openServers) server.close();
  if (tlsDir) rmSync(tlsDir, { recursive: true, force: true });
});

// ---------- (1) + (2) PIN IP & không resolve lại ----------

describe("I2.3 M4 — pin IP bằng socket thật", () => {
  it("kết nối tới IP đã pin dù hostname KHÔNG resolve được", async () => {
    const server = await startHttp("127.0.0.1");
    const result = await pinnedRequest({
      hostname: "recipe.test", // không tồn tại trên DNS
      address: "127.0.0.1",
      family: 4,
      port: server.port,
      protocol: "http:",
      path: "/cong-thuc",
      timeoutMs: 3000,
      maxBytes: 4096,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.status).toBe(200);
    expect(result.response.body.toString()).toBe("marker:127.0.0.1");
    // Đo địa chỉ kết nối THỰC TẾ.
    expect(result.response.remoteAddress).toBe("127.0.0.1");
    // Host header giữ hostname gốc (không phải IP).
    expect(server.seen[0]?.host).toContain("recipe.test");
    expect(server.seen[0]?.remote).toBe("127.0.0.1");
  });

  it("CONTROL: cùng hostname KHÔNG pin ⇒ thất bại (chứng minh thành công trên là do pin)", async () => {
    const server = await startHttp("127.0.0.1");
    const failure = await new Promise<string>((resolve) => {
      const req = http.request(
        { host: "recipe.test", port: server.port, path: "/", timeout: 2000 },
        (res) => {
          res.resume();
          res.on("end", () => resolve("UNEXPECTED_SUCCESS"));
        },
      );
      req.on("timeout", () => {
        req.destroy();
        resolve("TIMEOUT");
      });
      req.on("error", (error: NodeJS.ErrnoException) => resolve(error.code ?? "ERROR"));
      req.end();
    });
    expect(failure).not.toBe("UNEXPECTED_SUCCESS");
    expect(server.seen.length).toBe(0);
  });

  it("kết nối đi ĐÚNG IP đã chọn (phân biệt hai loopback khác IP)", async () => {
    const a = await startHttp("127.0.0.1");
    const b = await startHttp("127.0.0.2");

    const toB = await pinnedRequest({
      hostname: "target.test",
      address: "127.0.0.2",
      family: 4,
      port: b.port,
      protocol: "http:",
      path: "/",
      timeoutMs: 3000,
      maxBytes: 4096,
    });

    expect(toB.ok).toBe(true);
    if (!toB.ok) return;
    expect(toB.response.body.toString()).toBe("marker:127.0.0.2");
    expect(toB.response.remoteAddress).toBe("127.0.0.2");
    // Server A KHÔNG hề nhận request nào.
    expect(a.seen.length).toBe(0);
    expect(b.seen.length).toBe(1);
  });
});

// ---------- (3) TLS/SNI ----------

let tlsDir: string | null = null;
let tlsMaterial: { key: string; cert: string } | null = null;

function ensureTlsMaterial(): { key: string; cert: string } | null {
  if (tlsMaterial) return tlsMaterial;
  try {
    tlsDir = mkdtempSync(join(tmpdir(), "wale-tls-"));
    const keyPath = join(tlsDir, "key.pem");
    const certPath = join(tlsDir, "cert.pem");
    const configPath = join(tlsDir, "openssl.cnf");
    writeFileSync(
      configPath,
      [
        "[req]",
        "distinguished_name=dn",
        "x509_extensions=v3",
        "prompt=no",
        "[dn]",
        "CN=recipe.test",
        "[v3]",
        "subjectAltName=DNS:recipe.test",
        "basicConstraints=CA:TRUE",
        "",
      ].join("\n"),
    );
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-days",
        "1",
        "-config",
        configPath,
      ],
      { stdio: "ignore" },
    );
    tlsMaterial = { key: readFileSync(keyPath, "utf8"), cert: readFileSync(certPath, "utf8") };
    return tlsMaterial;
  } catch {
    return null;
  }
}

describe("I2.3 M4 — TLS/SNI với pin IP", () => {
  it("giữ SNI + xác minh cert theo hostname gốc (tự ký tin cậy qua ca)", async () => {
    const material = ensureTlsMaterial();
    if (!material) {
      console.warn("[security] bỏ qua test TLS: không tạo được chứng chỉ (thiếu openssl).");
      return;
    }
    const servernames: Array<string | undefined> = [];
    const server = track(
      https.createServer({ key: material.key, cert: material.cert }, (_req, res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("tls-ok");
      }),
    );
    server.on("secureConnection", (socket) => {
      servernames.push((socket as { servername?: string }).servername);
    });
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
      ca: material.cert,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.status).toBe(200);
      expect(result.response.body.toString()).toBe("tls-ok");
      expect(result.response.remoteAddress).toBe("127.0.0.1");
    }
    expect(servernames).toContain("recipe.test");
  });

  it("từ chối TLS khi chứng chỉ không khớp hostname", async () => {
    const material = ensureTlsMaterial();
    if (!material) return;
    const server = track(
      https.createServer({ key: material.key, cert: material.cert }, (_req, res) => res.end("x")),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;

    const result = await pinnedRequest({
      hostname: "evil.test", // không khớp CN/SAN recipe.test
      address: "127.0.0.1",
      family: 4,
      port,
      protocol: "https:",
      path: "/",
      timeoutMs: 3000,
      maxBytes: 4096,
      ca: material.cert,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TLS_FAILED");
  });
});

// ---------- (4) resolve + xác minh (resolver giả) ----------

function fakeResolver(records: { ipv4?: string[]; ipv6?: string[] }): DnsResolver {
  return {
    async resolveAll() {
      return { ipv4: records.ipv4 ?? [], ipv6: records.ipv6 ?? [] };
    },
  };
}

describe("I2.3 M4 — resolveAndVerify (L3)", () => {
  it("từ chối khi DNS trả mixed public/private (bất kỳ địa chỉ xấu ⇒ chặn)", async () => {
    const result = await resolveAndVerify(
      "example.com",
      fakeResolver({ ipv4: ["93.184.216.34", "10.0.0.1"] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSAFE_ADDRESS");
  });

  it("chấp nhận khi toàn bộ địa chỉ public và chọn IP đầu (ưu tiên IPv4)", async () => {
    const result = await resolveAndVerify(
      "example.com",
      fakeResolver({ ipv4: ["93.184.216.34"], ipv6: ["2606:2800:220:1:248:1893:25c8:1946"] }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.target.address).toBe("93.184.216.34");
      expect(result.target.family).toBe(4);
      expect(result.target.allAddresses).toHaveLength(2);
    }
  });

  it("từ chối IPv6 nguy hiểm dù có kèm IPv4 public", async () => {
    const result = await resolveAndVerify(
      "example.com",
      fakeResolver({ ipv4: ["93.184.216.34"], ipv6: ["::ffff:127.0.0.1"] }),
    );
    expect(result.ok).toBe(false);
  });

  it("từ chối khi không có bản ghi (NO_ADDRESSES)", async () => {
    const result = await resolveAndVerify("example.com", fakeResolver({}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NO_ADDRESSES");
  });

  it("fail-closed khi resolver lỗi (DNS_FAILED)", async () => {
    const failing: DnsResolver = {
      async resolveAll() {
        throw new Error("resolver down");
      },
    };
    const result = await resolveAndVerify("example.com", failing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("DNS_FAILED");
  });

  it("từ chối IP literal nội bộ (defense in depth)", async () => {
    const result = await resolveAndVerify("127.0.0.1", fakeResolver({}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNSAFE_ADDRESS");
  });
});
