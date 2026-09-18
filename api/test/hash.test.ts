import { describe, it, expect } from "vitest";
import { Readable } from "stream";
import { createHash } from "crypto";
import { hashStreamSha256, hashBufferSha256, isValidSha256 } from "../src/utils/hash.js";

describe("Zero-Storage Hash Utility", () => {
  it("should calculate exact SHA-256 hash from in-memory stream", async () => {
    const content = "Diploma de Bacharelado em Ciência da Computação - Gabriel Henrique";
    const expectedHash = createHash("sha256").update(content).digest("hex");

    const stream = Readable.from([
      Buffer.from("Diploma de Bacharelado em "),
      Buffer.from("Ciência da Computação - "),
      Buffer.from("Gabriel Henrique"),
    ]);

    const result = await hashStreamSha256(stream);

    expect(result.hash).toBe(expectedHash);
    expect(result.byteLength).toBe(Buffer.byteLength(content));
    expect(isValidSha256(result.hash)).toBe(true);
  });

  it("should calculate identical SHA-256 for Buffer", () => {
    const buffer = Buffer.from("Certificado de Especialização em Inteligência Artificial");
    const expectedHash = createHash("sha256").update(buffer).digest("hex");

    const result = hashBufferSha256(buffer);
    expect(result).toBe(expectedHash);
    expect(isValidSha256(result)).toBe(true);
  });

  it("should correctly validate valid and invalid SHA-256 strings", () => {
    const valid = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const validWith0x = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const invalidLength = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85";
    const invalidChar = "g3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    expect(isValidSha256(valid)).toBe(true);
    expect(isValidSha256(validWith0x)).toBe(true);
    expect(isValidSha256(invalidLength)).toBe(false);
    expect(isValidSha256(invalidChar)).toBe(false);
  });
});
