/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    NEXT_PUBLIC_BLOCKCHAIN_RPC: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC || "http://127.0.0.1:8545",
  },
};

export default nextConfig;
