import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "ISSUER";
  institutionId: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (server) => {
  await server.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or missing authentication token",
      });
    }
  });
};

export default fp(authPlugin);
