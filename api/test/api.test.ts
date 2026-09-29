import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { blockchainService } from "../src/blockchain/blockchain.service.js";

describe("API Endpoints Integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health should return 200 and health payload", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  it("POST /api/auth/login should authenticate seeded staff", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "secretaria@universidade.edu.br",
        password: "Secretaria@123456",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe("secretaria@universidade.edu.br");
    expect(body.user.role).toBe("ISSUER");
  });

  it("POST /api/auth/login should reject invalid password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "secretaria@universidade.edu.br",
        password: "WrongPassword999",
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("Credenciais inválidas");
  });

  it("GET /api/stats should return summary metrics", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stats",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.stats).toBeDefined();
    expect(body.stats.institutions).toBeGreaterThanOrEqual(1);
    expect(body.blockchain).toBeDefined();
  });

  it("GET /api/documents/verify/:hash should strictly return NOT_FOUND for unregistered hash", async () => {
    vi.spyOn(blockchainService, "verifyDocument").mockResolvedValueOnce({
      exists: false,
      isValid: false,
      studentName: "",
      studentId: "",
      documentType: "",
      institutionName: "",
      issuerAddress: "0x0000000000000000000000000000000000000000",
      issuanceDate: null,
      isRevoked: false,
      revokedAt: null,
      revocationReason: "",
    });

    const randomHash = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const res = await app.inject({
      method: "GET",
      url: `/api/documents/verify/${randomHash}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("NOT_FOUND");
    expect(body.onChain.exists).toBe(false);
  });

  it("GET /api/documents/verify/:hash should reject malformed or non-hex hash with 400", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/documents/verify/invalid-hash-that-is-not-hex-characters",
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain("Hash SHA-256 inválido");
  });

  it("POST /api/documents/register-hash should reject unauthenticated request with 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/documents/register-hash",
      payload: {
        documentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        studentName: "Teste",
        studentId: "123",
        documentType: "Diploma",
        fileName: "test.pdf",
        fileSize: 100,
      },
    });

    expect(res.statusCode).toBe(401);
  });
});
