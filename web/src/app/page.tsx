"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UploadCloud,
  FileText,
  Search,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Printer,
  Lock,
  Cpu,
  Layers,
} from "lucide-react";
import { calculateFileSha256, formatBytes, truncateHash, isValidSha256 } from "@/utils/crypto";
import { verifyDocumentByHash, getPublicStats, VerificationResponse, StatsResponse } from "@/utils/api";

function HomeContent() {
  const searchParams = useSearchParams();
  const queryHash = searchParams.get("hash");
  const [activeTab, setActiveTab] = useState<"upload" | "hash">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [inputHash, setInputHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch public blockchain stats
  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch((err) => console.warn("Could not load stats:", err));
  }, []);

  // Handle URL query parameter ?hash=...
  useEffect(() => {
    if (queryHash) {
      const clean = queryHash.trim().replace(/^0x/, "");
      if (isValidSha256(clean)) {
        setActiveTab("hash");
        setInputHash("0x" + clean);
        setLoading(true);
        setError(null);
        setResult(null);
        verifyDocumentByHash(clean)
          .then(setResult)
          .catch((err) => setError(err.message || "Erro ao consultar hash na blockchain."))
          .finally(() => setLoading(false));
      }
    }
  }, [queryHash]);

  // Handle file selection
  const handleFileChange = async (selectedFile: File) => {
    setError(null);
    setResult(null);
    setFile(selectedFile);
    setLoading(true);

    try {
      // 1. Compute SHA-256 client-side (Zero-storage!)
      const hash = await calculateFileSha256(selectedFile);
      setInputHash("0x" + hash);

      // 2. Verify on blockchain via API
      const verification = await verifyDocumentByHash(hash);
      setResult(verification);
    } catch (err: any) {
      setError(err.message || "Erro durante a verificação do arquivo.");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual hash search
  const handleSearchHash = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputHash.trim()) return;

    setError(null);
    setResult(null);
    setFile(null);
    setLoading(true);

    try {
      const clean = inputHash.trim().replace(/^0x/, "");
      if (!isValidSha256(clean)) {
        throw new Error("O hash SHA-256 deve conter exatamente 64 caracteres hexadecimais válidos.");
      }
      const verification = await verifyDocumentByHash(clean);
      setResult(verification);
    } catch (err: any) {
      setError(err.message || "Erro ao consultar hash na blockchain.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "hash" | "tx") => {
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
          <Lock className="w-3.5 h-3.5" /> Prova de Integridade e Autenticidade
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Autenticação de Documentos Acadêmicos em Blockchain
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Verifique instantaneamente a autenticidade de diplomas, certificados e históricos escolares
          através da imutabilidade da Blockchain Ethereum, sem custos de transação e com privacidade absoluta.
        </p>

        {/* Zero-Storage Callout */}
        <div className="mt-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Zero-Storage (LGPD):</strong> Os arquivos não são armazenados. O cálculo do hash SHA-256 é realizado no seu próprio navegador via Web Crypto API.
          </span>
        </div>
      </div>

      {/* Verification Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={() => {
              setActiveTab("upload");
              setError(null);
            }}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload de Arquivo (PDF / Imagem)
          </button>
          <button
            onClick={() => {
              setActiveTab("hash");
              setError(null);
            }}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "hash"
                ? "border-blue-600 text-blue-600 bg-white shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Search className="w-4 h-4" />
            Buscar por Hash SHA-256
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "upload" ? (
            <div>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Arraste e solte o arquivo aqui ou clique para selecionar
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Suporta arquivos PDF, Imagens, Documentos Digitais (Diplomas, Certificados, Declarações)
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {file ? file.name : "Nenhum arquivo selecionado"}
                  {file && <span className="text-slate-400">({formatBytes(file.size)})</span>}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSearchHash} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Hash Criptográfico SHA-256 (64 caracteres)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value)}
                    placeholder="Ex: 0x4f8b2c89e1... ou 4f8b2c89e1..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !inputHash.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Consultar na Blockchain
              </button>
            </form>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <div className="font-semibold text-slate-800 text-sm">Processando verificação criptográfica...</div>
              <div className="text-xs text-slate-500 mt-1">
                Calculando digest SHA-256 e consultando o Smart Contract na rede.
              </div>
            </div>
          )}

          {/* Error display */}
          {error && !loading && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Erro na Verificação</div>
                <div className="text-xs mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Verification Results */}
          {result && !loading && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              {/* CASE 1: AUTHENTIC (GREEN) */}
              {result.status === "AUTHENTIC" && (
                <div className="bg-emerald-50/70 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-200/80 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 flex-shrink-0">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wide mb-1">
                          100% Válido & Autêntico
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Documento Acadêmico Autêntico
                        </h2>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          A integridade deste documento foi comprovada na Blockchain Ethereum. O hash do arquivo coincide exatamente com o registro imutável original.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-sm self-start sm:self-auto"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Comprovante
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-white/80 p-4 rounded-xl border border-emerald-200/60 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Aluno(a) Diplomado(a)
                      </span>
                      <div className="font-bold text-slate-900 text-base">
                        {result.onChain.studentName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Matrícula / RA: <span className="font-mono text-slate-800 font-semibold">{result.onChain.studentId}</span>
                      </div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-xl border border-emerald-200/60 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Instituição de Ensino Emissora
                      </span>
                      <div className="font-bold text-slate-900 text-base">
                        {result.onChain.institutionName || "Instituição Credenciada"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tipo: <span className="font-medium text-slate-800">{result.onChain.documentType}</span>
                      </div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-xl border border-emerald-200/60 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Data e Hora de Registro na Blockchain
                      </span>
                      <div className="font-semibold text-slate-900">
                        {result.onChain.issuanceDate
                          ? new Date(result.onChain.issuanceDate).toLocaleString("pt-BR", {
                              dateStyle: "long",
                              timeStyle: "medium",
                            })
                          : "Timestamp indisponível"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Registro temporal com carimbo imutável
                      </div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-xl border border-emerald-200/60 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Carteira da Secretaria (Issuer Relayer)
                      </span>
                      <div className="font-mono text-xs text-slate-800 break-all font-medium">
                        {result.onChain.issuerAddress}
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5 font-medium">
                        Assinatura Criptográfica Válida
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Hashes Footer */}
                  <div className="bg-white/90 p-4 rounded-xl border border-emerald-200/70 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-semibold text-slate-600">Hash SHA-256 do Documento:</span>
                      <div className="flex items-center gap-2 font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                        <span className="break-all">{result.hash}</span>
                        <button
                          onClick={() => copyToClipboard(result.hash, "hash")}
                          className="hover:text-blue-600 transition-colors"
                          title="Copiar Hash"
                        >
                          {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {result.offChain?.blockchainTxHash && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold text-slate-600">Transação Blockchain (TxHash):</span>
                        <div className="flex items-center gap-2 font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          <span className="break-all">{result.offChain.blockchainTxHash}</span>
                          <button
                            onClick={() => copyToClipboard(result.offChain!.blockchainTxHash, "tx")}
                            className="hover:text-blue-600 transition-colors"
                            title="Copiar TxHash"
                          >
                            {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {result.contractAddress && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-100 text-slate-500">
                        <span>Contrato Inteligente:</span>
                        <span className="font-mono">{result.contractAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CASE 2: REVOKED (ORANGE) */}
              {result.status === "REVOKED" && (
                <div className="bg-amber-50/70 border-2 border-amber-500 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start gap-4 pb-6 border-b border-amber-200/80 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 flex-shrink-0">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wide mb-1">
                        Documento Revogado
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Este Documento Foi Revogado pela Instituição
                      </h2>
                      <p className="text-xs text-amber-900 mt-0.5">
                        O registro histórico existe na blockchain, porém o documento foi expressamente cancelado ou revogado administrativamente.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/90 rounded-xl border border-amber-300 mb-6">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Motivo Oficial da Revogação:
                    </div>
                    <div className="text-sm font-medium text-slate-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      "{result.onChain.revocationReason || "Não especificado"}"
                    </div>
                    {result.onChain.revokedAt && (
                      <div className="text-xs text-slate-500 mt-2">
                        Data da revogação:{" "}
                        <span className="font-semibold text-slate-700">
                          {new Date(result.onChain.revokedAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60">
                      <span className="text-xs text-slate-500 block mb-1">Aluno(a)</span>
                      <div className="font-semibold text-slate-900">{result.onChain.studentName}</div>
                      <div className="text-xs text-slate-500">RA: {result.onChain.studentId}</div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60">
                      <span className="text-xs text-slate-500 block mb-1">Instituição</span>
                      <div className="font-semibold text-slate-900">{result.onChain.institutionName}</div>
                      <div className="text-xs text-slate-500">{result.onChain.documentType}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 3: NOT FOUND OR TAMPERED (RED) */}
              {result.status === "NOT_FOUND" && (
                <div className="bg-rose-50/80 border-2 border-rose-500 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start gap-4 pb-6 border-b border-rose-200/80 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 flex-shrink-0">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold uppercase tracking-wide mb-1">
                        Não Autêntico / Não Encontrado
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Nenhum Registro Encontrado na Blockchain
                      </h2>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        Este hash criptográfico não corresponde a nenhum documento emitido oficialmente.
                        Se o arquivo original sofreu <strong>qualquer modificação</strong> (mesmo de 1 caractere ou pixel),
                        o hash gerado torna-se completamente distinto (Efeito Avalanche Criptográfico).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
                    <div className="font-semibold text-slate-700">Hash SHA-256 Verificado:</div>
                    <div className="font-mono text-slate-800 bg-slate-100 p-2.5 rounded break-all border border-slate-200">
                      {result.hash}
                    </div>
                    <div className="text-slate-500 pt-1">
                      Certifique-se de estar testando o arquivo PDF original sem edições, anotações ou salvamentos secundários.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Blockchain Metrics Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Rede Blockchain e Smart Contract</h3>
              <p className="text-xs text-slate-400">Ambiente de Validação em Tempo Real</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Nó Ethereum Ativo (Localhost 8545)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 mb-1">Documentos Registrados</div>
            <div className="text-2xl font-bold text-blue-400">
              {stats?.stats.totalDocuments ?? 0}
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 mb-1">Documentos Válidos</div>
            <div className="text-2xl font-bold text-emerald-400">
              {stats?.stats.activeDocuments ?? 0}
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 mb-1">Documentos Revogados</div>
            <div className="text-2xl font-bold text-amber-400">
              {stats?.stats.revokedDocuments ?? 0}
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 mb-1">Altura do Bloco</div>
            <div className="text-2xl font-bold text-purple-400">
              #{stats?.blockchain.blockNumber ?? "---"}
            </div>
          </div>
        </div>

        {stats?.blockchain.contractAddress && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Contrato AcademicDocumentRegistry:</span>
            <span className="font-mono text-slate-300">{stats.blockchain.contractAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-400">
          Carregando portal de verificação...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
