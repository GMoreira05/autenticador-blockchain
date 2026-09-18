import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LoginInput, RegisterUserInput } from "./auth.schemas.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async validateUserCredentials(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: { institution: true },
    });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  async registerStaffUser(input: RegisterUserInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error("Já existe um usuário cadastrado com este e-mail");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: input.role,
        institutionId: input.institutionId,
      },
      include: { institution: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      createdAt: user.createdAt,
    };
  }

  async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            relayerAddress: true,
          },
        },
      },
    });
  }
}
