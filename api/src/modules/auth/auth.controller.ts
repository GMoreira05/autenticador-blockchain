import { FastifyPluginAsync } from "fastify";
import { AuthService } from "./auth.service.js";
import { loginSchema, registerUserSchema } from "./auth.schemas.js";

export const authRoutes: FastifyPluginAsync = async (server) => {
  const authService = new AuthService(server.prisma);

  // Login
  server.post("/login", async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: parseResult.error.flatten(),
      });
    }

    const user = await authService.validateUserCredentials(parseResult.data);
    if (!user) {
      return reply.status(401).send({
        error: "Credenciais inválidas",
        message: "E-mail ou senha incorretos",
      });
    }

    const token = server.jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
      },
      { expiresIn: "7d" }
    );

    // Audit log
    await server.prisma.auditLog.create({
      data: {
        action: "USER_LOGIN",
        userId: user.id,
        institutionId: user.institutionId,
        details: { email: user.email },
        ipAddress: request.ip,
      },
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: {
          id: user.institution.id,
          name: user.institution.name,
          code: user.institution.code,
        },
      },
    });
  });

  // Current user info
  server.get(
    "/me",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      const user = await authService.getUserProfile(request.user.id);
      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }
      return reply.send({ user });
    }
  );

  // Register user (Admin only)
  server.post(
    "/register",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Acesso negado. Apenas administradores podem cadastrar usuários." });
      }

      const parseResult = registerUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parseResult.error.flatten(),
        });
      }

      try {
        const newUser = await authService.registerStaffUser(parseResult.data);
        return reply.status(201).send({ user: newUser });
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    }
  );
};
