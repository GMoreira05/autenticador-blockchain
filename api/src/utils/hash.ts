import { createHash } from "crypto";
import { Readable } from "stream";

/**
 * Computes SHA-256 hash directly from an in-memory stream chunk-by-chunk.
 * ZERO-STORAGE: The file data is NEVER written to disk and never accumulated
 * in memory beyond the tiny streaming chunk size.
 */
export async function hashStreamSha256(stream: Readable): Promise<{ hash: string; byteLength: number }> {
  return new Promise((resolve, reject) => {
    const hasher = createHash("sha256");
    let byteLength = 0;
    let limitExceeded = false;

    stream.on("data", (chunk: Buffer) => {
      byteLength += chunk.length;
      hasher.update(chunk);
    });

    stream.on("limit", () => {
      limitExceeded = true;
      reject(new Error("Arquivo excede o tamanho máximo permitido (50 MB)"));
    });

    stream.on("end", () => {
      if (limitExceeded || (stream as any).truncated) {
        reject(new Error("Arquivo excede o tamanho máximo permitido (50 MB)"));
        return;
      }
      const hash = hasher.digest("hex");
      resolve({ hash, byteLength });
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Computes SHA-256 from a Buffer
 */
export function hashBufferSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Validates whether string is a valid 64-character SHA-256 hex string.
 */
export function isValidSha256(hex: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hex.replace(/^0x/, ""));
}
