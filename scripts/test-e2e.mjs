/**
 * End-to-End Test Script for Academic Document Blockchain Authenticator
 * Tests complete lifecycle:
 * 1. Health check of API & Database
 * 2. Staff Authentication (JWT)
 * 3. Document Registration (Zero-Storage in-memory stream + Blockchain Transaction)
 * 4. Public Verification (Status: AUTHENTIC)
 * 5. Tampering Test (Status: NOT_FOUND)
 * 6. Document Revocation On-Chain (Status: REVOKED)
 * 7. Verification of Revoked Status & Reason
 */

import { createHash } from "crypto";

const API_BASE = process.env.API_URL || "http://127.0.0.1:3001";

function logStep(step, message) {
  console.log(`\n🔹 [Passo ${step}] ${message}`);
}

function logSuccess(message) {
  console.log(`   ✅ ${message}`);
}

function logFailure(message) {
  console.error(`   ❌ ${message}`);
}

async function run() {
  console.log("==========================================================");
  console.log("🚀 INICIANDO TESTE DE FLUXO COMPLETO (END-TO-END)");
  console.log("   Autenticador de Documentos Acadêmicos via Blockchain");
  console.log("==========================================================");

  // 1. Healthcheck
  logStep(1, "Verificando integridade da API e serviços...");
  const healthRes = await fetch(`${API_BASE}/health`);
  if (!healthRes.ok) {
    throw new Error(`API health check falhou com status ${healthRes.status}`);
  }
  const healthData = await healthRes.json();
  logSuccess(`API Ativa: ${JSON.stringify(healthData)}`);

  // 2. Staff Authentication
  logStep(2, "Autenticando como Secretaria Acadêmica (Staff)...");
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "secretaria@universidade.edu.br",
      password: "Secretaria@123456",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Falha no login da secretaria: ${await loginRes.text()}`);
  }
  const { token, user } = await loginRes.json();
  logSuccess(`Autenticado com sucesso: ${user.name} (${user.role}) - Instituição: ${user.institution.name}`);

  // 3. Create mock academic document in-memory
  logStep(3, "Gerando documento acadêmico em memória (Simulação Zero-Storage)...");
  const studentName = "Juliana Almeida Fagundes";
  const studentId = "RA-2024-" + Math.floor(10000 + Math.random() * 90000);
  const documentType = "Diploma de Bacharelado em Engenharia de Software";
  const documentContent = `DIPLOMA UNIVERSITÁRIO OFICIAL\nCertificamos que ${studentName}, portadora do RA ${studentId}, concluiu o curso de Bacharelado em Engenharia de Software.\nEmitido em: ${new Date().toISOString()}`;

  const originalBuffer = Buffer.from(documentContent, "utf-8");
  const originalHash = createHash("sha256").update(originalBuffer).digest("hex");
  logSuccess(`Hash SHA-256 gerado em memória: 0x${originalHash}`);
  logSuccess(`Tamanho do arquivo: ${originalBuffer.length} bytes`);

  // 4. Register document via multipart stream
  logStep(4, "Registrando documento no Smart Contract via API (Zero-Storage)...");
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  let multipartBody = "";
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="studentName"\r\n\r\n${studentName}\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="studentId"\r\n\r\n${studentId}\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="documentType"\r\n\r\n${documentType}\r\n`;
  multipartBody += `--${boundary}\r\n`;
  multipartBody += `Content-Disposition: form-data; name="file"; filename="diploma_${studentId}.pdf"\r\n`;
  multipartBody += `Content-Type: application/pdf\r\n\r\n`;

  const payloadBuffer = Buffer.concat([
    Buffer.from(multipartBody, "utf-8"),
    originalBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8"),
  ]);

  const registerRes = await fetch(`${API_BASE}/api/documents/register-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: payloadBuffer,
  });

  if (!registerRes.ok) {
    throw new Error(`Falha no registro: ${await registerRes.text()}`);
  }
  const registerData = await registerRes.json();
  logSuccess(`Transação minerada na Blockchain! TxHash: ${registerData.blockchain.txHash}`);
  logSuccess(`Bloco: #${registerData.blockchain.blockNumber}`);

  // 5. Public Verification: Authentic Document
  logStep(5, "Executando Verificação Pública do Hash original...");
  const verifyRes = await fetch(`${API_BASE}/api/documents/verify/${originalHash}`);
  if (!verifyRes.ok) {
    throw new Error(`Falha na verificação pública: ${await verifyRes.text()}`);
  }
  const verifyData = await verifyRes.json();

  if (verifyData.status !== "AUTHENTIC") {
    throw new Error(`Esperava status AUTHENTIC mas recebeu ${verifyData.status}`);
  }
  logSuccess(`Status verificado com sucesso: 🟢 ${verifyData.status}`);
  logSuccess(`Aluno confirmado na rede: ${verifyData.onChain.studentName} (RA: ${verifyData.onChain.studentId})`);
  logSuccess(`Instituição emissora: ${verifyData.onChain.institutionName}`);
  logSuccess(`Contrato inteligente: ${verifyData.contractAddress}`);

  // 5a. Format Validation Test
  logStep("5a", "Testando validação de formato de hash SHA-256...");
  const invalidHashRes = await fetch(`${API_BASE}/api/documents/verify/invalid-hash-string`);
  if (invalidHashRes.status !== 400) {
    throw new Error(`Esperava status 400 para hash inválido mas recebeu ${invalidHashRes.status}`);
  }
  logSuccess("Hash com formato inválido rejeitado com 400 Bad Request!");

  // 6. Anti-Tampering Test: Altering single character
  logStep(6, "Testando Resistência contra Adulteração (Efeito Avalanche)...");
  const tamperedContent = documentContent + " [FRAUDE: NOTA ALTERADA]";
  const tamperedBuffer = Buffer.from(tamperedContent, "utf-8");
  const tamperedHash = createHash("sha256").update(tamperedBuffer).digest("hex");
  logSuccess(`Hash do arquivo adulterado: 0x${tamperedHash}`);

  const tamperedVerifyRes = await fetch(`${API_BASE}/api/documents/verify/${tamperedHash}`);
  const tamperedVerifyData = await tamperedVerifyRes.json();

  if (tamperedVerifyData.status !== "NOT_FOUND") {
    throw new Error(`Esperava status NOT_FOUND para arquivo adulterado mas recebeu ${tamperedVerifyData.status}`);
  }
  logSuccess(`Documento adulterado rejeitado corretamente: 🔴 ${tamperedVerifyData.status}`);

  // 7a. Unauthorized Revocation Test
  logStep("7a", "Testando proteção contra revogação não autenticada...");
  const unauthRevokeRes = await fetch(`${API_BASE}/api/documents/${originalHash}/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Tentativa de revogação fraudulenta sem token" }),
  });
  if (unauthRevokeRes.status !== 401) {
    throw new Error(`Esperava status 401 mas recebeu ${unauthRevokeRes.status}`);
  }
  logSuccess("Tentativa não autenticada bloqueada com sucesso (401 Unauthorized)!");

  // 7. Revocation Test
  logStep(7, "Executando Revogação On-Chain do documento pela Secretaria...");
  const revocationReason = "Cancelamento administrativo por divergência cadastral";
  const revokeRes = await fetch(`${API_BASE}/api/documents/${originalHash}/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason: revocationReason }),
  });

  if (!revokeRes.ok) {
    throw new Error(`Falha na revogação: ${await revokeRes.text()}`);
  }
  const revokeData = await revokeRes.json();
  logSuccess(`Revogação gravada na blockchain! TxHash: ${revokeData.blockchain.txHash}`);

  // 8. Public Verification of Revoked Document
  logStep(8, "Verificando status público após a revogação...");
  const verifyRevokedRes = await fetch(`${API_BASE}/api/documents/verify/${originalHash}`);
  const verifyRevokedData = await verifyRevokedRes.json();

  if (verifyRevokedData.status !== "REVOKED") {
    throw new Error(`Esperava status REVOKED mas recebeu ${verifyRevokedData.status}`);
  }
  logSuccess(`Status atualizado na blockchain: 🟠 ${verifyRevokedData.status}`);
  logSuccess(`Motivo público da revogação: "${verifyRevokedData.onChain.revocationReason}"`);

  console.log("\n==========================================================");
  console.log("🎉 TODOS OS TESTES E2E FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  console.log("==========================================================");
}

run().catch((err) => {
  logFailure(`Erro fatal no teste E2E: ${err.message}`);
  process.exit(1);
});
