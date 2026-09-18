/**
 * Computes SHA-256 hash completely client-side in the browser
 * using the high-performance Web Crypto API (SubtleCrypto).
 * 
 * ZERO-STORAGE: The file data NEVER leaves the user's machine!
 */
export async function calculateFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Validates a 64-character SHA-256 hex string.
 */
export function isValidSha256(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash.replace(/^0x/, ""));
}

/**
 * Formats a long hash or ethereum address for UI display:
 * 0x1234...5678
 */
export function truncateHash(hash: string, start = 8, end = 8): string {
  if (!hash || hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
