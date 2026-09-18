import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function start() {
  const app = buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`====================================================`);
    console.log(`🚀 API Server running at ${address}`);
    console.log(`📚 Swagger Documentation at ${address}/docs`);
    console.log(`🔗 Blockchain RPC target: ${env.BLOCKCHAIN_RPC_URL}`);
    console.log(`💾 Zero-Storage Mode: ACTIVE (Files are never saved)`);
    console.log(`====================================================`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
