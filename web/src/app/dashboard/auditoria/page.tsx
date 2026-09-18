"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  Ban,
  Layers,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { getPublicStats, listDocuments } from "@/utils/api";
import { truncateHash } from "@/utils/crypto";

export default function AuditLogPage() {
  const [stats, setStats] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    Promise.all([getPublicStats(), listDocuments({ limit: 50 }, token)])
      .then(([statsData, docsData]) => {
        setStats(statsData);
        setDocuments(docsData.documents || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Auditoria Imutável Blockchain</h2>
            <p className="text-xs text-slate-500">
              Trilha de auditoria criptográfica e eventos minerados no Smart Contract
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Rede Blockchain</span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Hardhat Localhost (Chain ID: 31337)
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Altura do Bloco</span>
            <div className="font-bold text-slate-900 text-sm">
              #{stats?.blockchain.blockNumber ?? "---"}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Custo de Operação (Gas Fee)</span>
            <div className="font-bold text-emerald-600 text-sm">
              R$ 0,00 (Zero-Cost Local Relayer)
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          Histórico de Eventos On-Chain Minerados
        </h3>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Consultando blocos e eventos...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum evento registrado até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      doc.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doc.status === "ACTIVE" ? (
                      <FileCheck className="w-4 h-4" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {doc.status === "ACTIVE" ? "DocumentRegistered" : "DocumentRevoked"}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                        Bloco #{doc.blockNumber}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {doc.studentName} ({doc.documentType}) • RA:{" "}
                      <span className="font-mono font-medium">{doc.studentId}</span>
                    </div>
                    <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                      Hash SHA-256: 0x{truncateHash(doc.documentHash, 8, 8)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 self-end sm:self-auto">
                  <div className="text-slate-500">
                    {new Date(doc.createdAt).toLocaleString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] bg-white border border-slate-200 px-2 py-1 rounded">
                    <span>Tx: {truncateHash(doc.blockchainTxHash, 6, 6)}</span>
                    <button
                      onClick={() => handleCopy(doc.blockchainTxHash)}
                      className="hover:text-blue-600"
                      title="Copiar TxHash"
                    >
                      {copiedTx === doc.blockchainTxHash ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    <Link
                      href={`/?hash=${doc.documentHash}`}
                      target="_blank"
                      className="hover:text-blue-600"
                      title="Verificar"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
