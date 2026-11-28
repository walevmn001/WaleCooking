import { describe, expect, it } from "vitest";

import { SsrfUrlValidator } from "@/lib/import/ssrf/url-validator";
import { classifyIp, isBlockedIp } from "@/lib/import/ssrf/ip";
import { isDeniedHostname, registrableDomain } from "@/lib/import/ssrf/hostname";
import { MAX_URL_LENGTH } from "@/lib/import/validation";

const validator = new SsrfUrlValidator();

/** Chạy validator và trả reason khi bị từ chối (giúp assert gọn). */
function reasonFor(url: string): string | null {
  const result = validator.validate(url);
  return result.ok ? null : result.reason;
}

describe("SsrfUrlValidator — cho phép public (L1/L2)", () => {
  it("cho phép public IPv4 (HTTPS)", () => {
    const result = validator.validate("https://93.184.216.34/cong-thuc");
    expect(result.ok).toBe(true);
  });

  it("cho phép public IPv6", () => {
    const result = validator.validate("https://[2606:2800:220:1:248:1893:25c8:1946]/a");
    expect(result.ok).toBe(true);
  });

  it("cho phép tên miền công khai", () => {
    const result = validator.validate("https://example.com/cong-thuc?x=1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.info.hostname).toBe("example.com");
      expect(result.info.domain).toBe("example.com");
      expect(result.info.protocol).toBe("https:");
    }
  });

  it("cho phép public IPv4 IPv4-mapped IPv6 (giải nén & kiểm lại ⇒ public)", () => {
    const result = validator.validate("https://[::ffff:93.184.216.34]/");
    expect(result.ok).toBe(true);
  });
});

describe("SsrfUrlValidator — chặn IP nội bộ/metadata (L2)", () => {
  it.each([
    ["http://127.0.0.1/", "loopback"],
    ["http://127.0.0.2/", "loopback"],
    ["http://10.0.0.5/", "private"],
    ["http://172.16.4.4/", "private"],
    ["http://172.31.255.254/", "private"],
    ["http://192.168.0.1/", "private"],
    ["http://169.254.1.1/", "link_local"],
    ["http://169.254.169.254/latest/meta-data/", "metadata (link-local)"],
    ["http://0.0.0.0/", "this-network"],
    ["http://100.64.0.1/", "cgnat"],
    ["http://224.0.0.1/", "multicast"],
    ["http://240.0.0.1/", "reserved"],
    ["http://255.255.255.255/", "broadcast"],
  ])("chặn %s (%s)", (url) => {
    expect(reasonFor(url)).toBe("DISALLOWED_IP_LITERAL");
  });

  it.each([
    ["http://[::1]/", "loopback v6"],
    ["http://[::]/", "unspecified v6"],
    ["http://[fe80::1]/", "link-local v6"],
    ["http://[fc00::1]/", "ULA v6"],
    ["http://[fd00:ec2::254]/", "AWS IMDSv6"],
    ["http://[ff02::1]/", "multicast v6"],
    ["http://[2001:db8::1]/", "documentation v6"],
    ["http://[::ffff:127.0.0.1]/", "IPv4-mapped loopback"],
    ["http://[::ffff:10.0.0.1]/", "IPv4-mapped private"],
    ["http://[64:ff9b::10.0.0.1]/", "NAT64 private"],
  ])("chặn %s (%s)", (url) => {
    expect(reasonFor(url)).toBe("DISALLOWED_IP_LITERAL");
  });
});

describe("SsrfUrlValidator — biến thể biểu diễn IP bất thường (L1/L2)", () => {
  it.each([
    ["http://2130706433/", "decimal 127.0.0.1"],
    ["http://0x7f000001/", "hex 127.0.0.1"],
    ["http://0177.0.0.1/", "octal 127.0.0.1"],
    ["http://127.1/", "short form 127.0.0.1"],
    ["http://3232235777/", "decimal 192.168.1.1"],
  ])("chặn %s (%s) — WHATWG chuẩn hoá về dotted-quad", (url) => {
    expect(reasonFor(url)).toBe("DISALLOWED_IP_LITERAL");
  });
});

describe("SsrfUrlValidator — hostname nội bộ/metadata (L5)", () => {
  it.each([
    ["http://localhost/"],
    ["http://localhost:443/"],
    ["http://api.localhost/"],
    ["http://printer.local/"],
    ["http://service.internal/"],
    ["http://metadata.google.internal/"],
    ["http://metadata/"],
    ["http://instance-data/"],
    ["http://db.cluster.local/"],
    ["http://thing.home.arpa/"],
  ])("chặn %s", (url) => {
    expect(reasonFor(url)).toBe("DISALLOWED_HOSTNAME");
  });
});

describe("SsrfUrlValidator — scheme & credentials (L1)", () => {
  it.each([
    "file:///etc/passwd",
    "gopher://example.com/",
    "ftp://example.com/",
    "data:text/html,hi",
    "ws://example.com/",
    "javascript:alert(1)",
  ])("chặn scheme: %s", (url) => {
    expect(reasonFor(url)).toBe("UNSUPPORTED_SCHEME");
  });

  it.each([
    "http://user:pass@example.com/",
    "https://user@example.com/",
    "http://:pass@example.com/",
  ])("chặn URL chứa credentials: %s", (url) => {
    expect(reasonFor(url)).toBe("URL_HAS_CREDENTIALS");
  });
});

describe("SsrfUrlValidator — port (L7)", () => {
  it.each([
    ["http://example.com:8080/", "http 8080"],
    ["https://example.com:8443/", "https 8443"],
    ["http://example.com:6379/", "redis"],
    ["http://example.com:5432/", "postgres"],
    ["http://example.com:3306/", "mysql"],
  ])("chặn port không hợp lệ: %s (%s)", (url) => {
    expect(reasonFor(url)).toBe("DISALLOWED_PORT");
  });

  it.each(["http://example.com:80/", "https://example.com:443/"])("cho phép port chuẩn: %s", (url) => {
    expect(validator.validate(url).ok).toBe(true);
  });
});

describe("SsrfUrlValidator — malformed / quá dài (L1)", () => {
  it("chặn chuỗi rỗng", () => {
    expect(reasonFor("")).toBe("MALFORMED_URL");
  });

  it("chặn URL không parse được", () => {
    expect(reasonFor("not a url")).toBe("MALFORMED_URL");
  });

  it("chặn URL vượt trần ký tự", () => {
    const url = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    expect(reasonFor(url)).toBe("URL_TOO_LONG");
  });
});

describe("SsrfUrlValidator — chuẩn hoá URL", () => {
  it("bỏ fragment và query tracking nhưng giữ query thật", () => {
    const result = validator.validate(
      "https://Example.com/cong-thuc?utm_source=fb&id=7#phan-2",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.info.hostname).toBe("example.com");
      expect(result.info.normalized).toBe("https://example.com/cong-thuc?id=7");
      expect(result.info.normalized).not.toContain("utm_source");
      expect(result.info.normalized).not.toContain("#");
    }
  });

  it("giữ nguyên giá trị raw (phân biệt raw vs normalized)", () => {
    const raw = "https://example.com/a?utm_source=x";
    const result = validator.validate(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.info.raw).toBe(raw);
      expect(result.info.normalized).not.toBe(raw);
    }
  });

  it("suy eTLD+1: subdomain → domain gốc", () => {
    const result = validator.validate("https://blog.example.com/bai-viet");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.info.domain).toBe("example.com");
  });
});

describe("classifyIp / isBlockedIp", () => {
  it("trả null cho chuỗi không phải IP (KHÔNG coi là an toàn)", () => {
    expect(classifyIp("example.com")).toBeNull();
    expect(classifyIp("999.1.1.1")).toBeNull();
    expect(isBlockedIp("example.com")).toBe(false);
  });

  it("phân loại đúng public vs private", () => {
    expect(classifyIp("93.184.216.34")?.blocked).toBe(false);
    expect(classifyIp("10.1.2.3")?.blocked).toBe(true);
    expect(classifyIp("10.1.2.3")?.reason).toBe("private");
  });
});

describe("isDeniedHostname / registrableDomain", () => {
  it("chặn hostname nội bộ, không chặn domain công khai", () => {
    expect(isDeniedHostname("localhost")).toBe(true);
    expect(isDeniedHostname("a.internal")).toBe(true);
    expect(isDeniedHostname("example.com")).toBe(false);
    expect(isDeniedHostname("internal.example.com")).toBe(false);
  });

  it("suy eTLD+1 với public suffix nhiều phần", () => {
    expect(registrableDomain("a.b.example.co.uk")).toBe("example.co.uk");
    expect(registrableDomain("example.vn")).toBe("example.vn");
    expect(registrableDomain("x.sub.example.com")).toBe("example.com");
  });
});
