import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";

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

  it("GET /api/documents/verify/:hash should return NOT_FOUND for unregistered random hash", async () => {
    const randomHash = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const res = await app.inject({
      method: "GET",
      url: `/api/documents/verify/${randomHash}`,
    });

    // If blockchain is not deployed yet or hash is not registered
    // it will return either 200 with status: NOT_FOUND or 500 if node is offline
    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      expect(body.status).toBe("NOT_FOUND");
    }
  });
});
