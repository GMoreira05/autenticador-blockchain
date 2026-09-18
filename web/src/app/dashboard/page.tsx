"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FilePlus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { getPublicStats, listDocuments, StatsResponse } from "@/utils/api";
import { truncateHash } from "@/utils/crypto";

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    Promise.all([
      getPublicStats(),
      listDocuments({ limit: 5 }, token),
    ])
      .then(([statsData, docsData]) => {
        setStats(statsData);
        setRecentDocs(docsData.documents || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Emitidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.stats.totalDocuments ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Registros na base</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Documentos Válidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats?.stats.activeDocuments ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Integridade 100% ativa</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revogados
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats?.stats.revokedDocuments ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Cancelados na rede</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Altura do Bloco
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            #{stats?.blockchain.blockNumber ?? "---"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Nó Ethereum Local</div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Emitir e Ancorar Novo Documento Acadêmico</h3>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Faça upload do arquivo para calcular o hash SHA-256 e gravar a prova de autenticidade instantaneamente na blockchain. Zero-Storage garantido.
          </p>
        </div>
        <Link
          href="/dashboard/emitir"
          className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          <span>Nova Emissão</span>
        </Link>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Últimos Documentos Registrados</h3>
          <Link
            href="/dashboard/documentos"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver todos ({stats?.stats.totalDocuments ?? 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Carregando documentos...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum documento registrado até o momento.
            <div className="mt-3">
              <Link
                href="/dashboard/emitir"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Clique aqui para emitir o primeiro documento.
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Aluno</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{doc.studentName}</div>
                      <div className="text-xs text-slate-400 font-mono">RA: {doc.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{doc.documentType}</div>
                      <div className="text-xs text-slate-400 font-mono">{truncateHash(doc.documentHash, 6, 6)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Revogado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/?hash=${doc.documentHash}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Verificar
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
