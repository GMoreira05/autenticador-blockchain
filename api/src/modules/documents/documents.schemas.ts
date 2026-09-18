import { z } from "zod";

export const registerHashSchema = z.object({
  documentHash: z
    .string()
    .regex(/^(0x)?[a-fA-F0-9]{64}$/, "Hash SHA-256 deve ter 64 caracteres hexadecimais"),
  studentName: z.string().min(2, "Nome do aluno é obrigatório"),
  studentId: z.string().min(1, "Matrícula/Identificador é obrigatório"),
  documentType: z.string().min(2, "Tipo do documento é obrigatório"),
  fileName: z.string().min(1, "Nome original do arquivo é obrigatório"),
  fileSize: z.coerce.number().min(1, "Tamanho do arquivo inválido"),
  mimeType: z.string().default("application/pdf"),
});

export type RegisterHashInput = z.infer<typeof registerHashSchema>;

export const revokeDocumentSchema = z.object({
  reason: z.string().min(5, "Motivo da revogação deve conter no mínimo 5 caracteres"),
});

export type RevokeDocumentInput = z.infer<typeof revokeDocumentSchema>;

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "REVOKED"]).optional(),
  documentType: z.string().optional(),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
