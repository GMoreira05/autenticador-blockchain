import { FastifyPluginAsync } from "fastify";
import { DocumentsService } from "./documents.service.js";
import {
  registerHashSchema,
  revokeDocumentSchema,
  listDocumentsQuerySchema,
} from "./documents.schemas.js";
import { hashStreamSha256 } from "../../utils/hash.js";

export const documentRoutes: FastifyPluginAsync = async (server) => {
  const documentsService = new DocumentsService(server.prisma);

  /**
   * ZERO-STORAGE FILE REGISTRATION:
   * Streams the uploaded file through an in-memory SHA-256 hasher.
   * Discards the file chunks immediately after hashing.
   * The file is NEVER written to the filesystem or database.
   */
  server.post(
    "/register-file",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      const parts = request.parts();

      let studentName = "";
      let studentId = "";
      let documentType = "";
      let fileName = "";
      let mimeType = "application/pdf";
      let computedHash = "";
      let byteLength = 0;

      for await (const part of parts) {
        if (part.type === "file") {
          fileName = part.filename;
          mimeType = part.mimetype;
          // Hash stream in-memory without saving
          const result = await hashStreamSha256(part.file);
          computedHash = result.hash;
          byteLength = result.byteLength;
        } else {
          const fieldName = part.fieldname;
          const fieldValue = String(part.value);
          if (fieldName === "studentName") studentName = fieldValue;
          if (fieldName === "studentId") studentId = fieldValue;
          if (fieldName === "documentType") documentType = fieldValue;
        }
      }

      if (!computedHash) {
        return reply.status(400).send({ error: "Nenhum arquivo enviado para autenticação" });
      }
      if (!studentName || !studentId || !documentType) {
        return reply.status(400).send({
          error: "Campos obrigatórios ausentes: studentName, studentId, documentType",
        });
      }

      try {
        const result = await documentsService.registerDocument(
          {
            documentHash: computedHash,
            studentName,
            studentId,
            documentType,
            fileName: fileName || "documento.pdf",
            fileSize: byteLength,
            mimeType,
          },
          request.user
        );

        return reply.status(201).send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    }
  );

  /**
   * Direct hash registration (for client-side pre-hashed files)
   */
  server.post(
    "/register-hash",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      const parseResult = registerHashSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parseResult.error.flatten(),
        });
      }

      try {
        const result = await documentsService.registerDocument(
          parseResult.data,
          request.user
        );
        return reply.status(201).send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    }
  );

  /**
   * Public verification endpoint (NO authentication required!)
   */
  server.get("/verify/:hash", async (request, reply) => {
    const { hash } = request.params as { hash: string };
    if (!hash || hash.length < 64) {
      return reply.status(400).send({ error: "Hash SHA-256 inválido" });
    }

    try {
      const result = await documentsService.verifyDocument(hash);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({
        error: "Falha na verificação blockchain",
        message: err.message,
      });
    }
  });

  /**
   * Revoke a registered document
   */
  server.post(
    "/:hash/revoke",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      const { hash } = request.params as { hash: string };
      const parseResult = revokeDocumentSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Dados inválidos",
          details: parseResult.error.flatten(),
        });
      }

      try {
        const result = await documentsService.revokeDocument(
          hash,
          parseResult.data,
          request.user
        );
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    }
  );

  /**
   * List issued documents (Authenticated)
   */
  server.get(
    "/",
    { preHandler: [server.authenticate] },
    async (request, reply) => {
      const parseResult = listDocumentsQuerySchema.safeParse(request.query);
      const query = parseResult.success ? parseResult.data : { page: 1, limit: 10 };

      // Staff only sees their institution's documents
      const institutionId = request.user.role === "ADMIN" ? undefined : request.user.institutionId;
      const result = await documentsService.listDocuments(query, institutionId);
      return reply.send(result);
    }
  );
};
