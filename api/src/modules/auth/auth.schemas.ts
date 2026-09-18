import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerUserSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "ISSUER"]).default("ISSUER"),
  institutionId: z.string().uuid("ID da instituição inválido"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
