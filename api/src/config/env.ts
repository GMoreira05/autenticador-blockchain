import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgrespassword@localhost:5434/academic_blockchain_db?schema=public"),
  JWT_SECRET: z.string().default("academic-blockchain-secret-jwt-key-2026-very-secure-min-32-chars"),
  BLOCKCHAIN_RPC_URL: z.string().default("http://127.0.0.1:8545"),
  // Default Hardhat Account #0 (pre-funded with 10000 ETH)
  RELAYER_PRIVATE_KEY: z.string().default("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"),
  CONTRACT_ADDRESS: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
