import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presignGetObject } from "@aws-sdk/s3-request-presigner";

import type { PutObjectInput, StoragePort, StoredObject } from "./storage.port";

/**
 * R2StorageAdapter — Cloudflare R2 qua API tương thích S3 (P02 §MEDIA_STORAGE).
 *
 * - Thông tin kết nối lấy từ biến môi trường (`R2_*`), KHÔNG hardcode credentials.
 * - Chỉ khởi tạo khi đã cấu hình đủ; nếu thiếu → ném lỗi rõ ràng (không lộ giá trị).
 * - Đổi sang S3/B2/MinIO = đổi endpoint + keys trong cấu hình, không đổi adapter.
 */

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
}

/** Có cấu hình R2 đầy đủ để dùng provider R2 hay không. */
export function hasR2Env(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

/** Đọc cấu hình R2 từ env; ném lỗi nếu thiếu (KHÔNG in giá trị bí mật). */
export function readR2Config(): R2Config {
  const missing: string[] = [];
  if (!process.env.R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!process.env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!process.env.R2_BUCKET) missing.push("R2_BUCKET");
  if (missing.length > 0) {
    throw new Error(
      `[storage] Thiếu cấu hình R2: ${missing.join(", ")}. Đặt các biến này hoặc dùng local provider.`,
    );
  }
  return {
    accountId: process.env.R2_ACCOUNT_ID as string,
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    bucket: process.env.R2_BUCKET as string,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
}

export class R2StorageAdapter implements StoragePort {
  readonly provider = "r2" as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;

  constructor(config: R2Config = readR2Config()) {
    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { key: input.key, url: this.publicUrl(input.key) };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    const base = (this.publicBaseUrl ?? "").replace(/\/+$/, "");
    return base ? `${base}/${key}` : key;
  }

  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    return presignGetObject(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: ttlSeconds },
    );
  }
}
