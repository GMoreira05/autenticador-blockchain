import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import prismaPlugin from "./plugins/prisma.plugin.js";
import authPlugin from "./plugins/auth.plugin.js";
import { authRoutes } from "./modules/auth/auth.controller.js";
import { documentRoutes } from "./modules/documents/documents.controller.js";
import { statsRoutes } from "./modules/stats/stats.controller.js";
import { blockchainService } from "./blockchain/blockchain.service.js";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "silent" : "info",
    },
  });

  // CORS
  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // Multipart file handling (Zero-storage stream)
  app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
      files: 1,
    },
  });

  // Swagger Documentation
  app.register(swagger, {
    openapi: {
      info: {
        title: "Academic Document Blockchain Authenticator API",
        description: "Zero-storage academic document integrity verification microservice",
        version: "1.0.0",
      },
    },
  });
  app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Database & Auth plugins
  app.register(prismaPlugin);
  app.register(authPlugin);

  // Healthcheck
  app.get("/health", async () => {
    const blockchainStatus = await blockchainService.isReady();
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      blockchainConnected: blockchainStatus,
      contractAddress: blockchainService.getContractAddress(),
    };
  });

  // Register API modules
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(documentRoutes, { prefix: "/api/documents" });
  app.register(statsRoutes, { prefix: "/api/stats" });

  return app;
}
