"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Ban,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { listDocuments, revokeDocument } from "@/utils/api";
import { truncateHash, formatBytes } from "@/utils/crypto";

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revocation Modal State
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const fetchDocs = async (page = 1) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setLoading(true);
    try {
      const data = await listDocuments(
        {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        },
        token
      );
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(1);
  }, [search, statusFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !revocationReason.trim()) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setRevokeError(null);
    setRevoking(true);

    try {
      await revokeDocument(selectedDoc.documentHash, revocationReason.trim(), token);
      setSelectedDoc(null);
      setRevocationReason("");
      // Refresh list
      fetchDocs(pagination.page);
    } catch (err: any) {
      setRevokeError(err.message || "Erro ao revogar documento na blockchain.");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Documentos Emitidos</h2>
            <p className="text-xs text-slate-500">
              Gerencie os certificados emitidos e execute revogações on-chain se necessário
            </p>
          </div>
          <Link
            href="/dashboard/emitir"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            + Emitir Novo
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por aluno, RA, tipo de documento ou hash..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Apenas Válidos</option>
            <option value="REVOKED">Apenas Revogados</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Carregando registros acadêmicos...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Nenhum documento encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Aluno / Matrícula</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Hash SHA-256</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Emissão</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{doc.studentName}</div>
                      <div className="text-xs text-slate-500 font-mono">RA: {doc.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{doc.documentType}</div>
                      <div className="text-xs text-slate-400">
                        {doc.fileName} ({formatBytes(doc.fileSize)})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
                        <span>0x{truncateHash(doc.documentHash, 6, 6)}</span>
                        <button
                          onClick={() => handleCopy("0x" + doc.documentHash, doc.id)}
                          className="hover:text-blue-600"
                          title="Copiar Hash Completo"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Revogado
                          </span>
                          {doc.revocationReason && (
                            <div className="text-[11px] text-slate-500 mt-1 italic max-w-xs truncate" title={doc.revocationReason}>
                              "{doc.revocationReason}"
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div>{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</div>
                      <div className="font-mono text-slate-400 text-[11px]">Bloco #{doc.blockNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/?hash=${doc.documentHash}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Verificar Publicamente"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {doc.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setRevocationReason("");
                              setRevokeError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revogar Documento On-Chain"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchDocs(pagination.page - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDocs(pagination.page + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Ban className="w-5 h-5" />
                <span>Revogar Documento Acadêmico</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revokeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{revokeError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Você está prestes a revogar na <strong>Blockchain</strong> o documento de{" "}
              <strong>{selectedDoc.studentName}</strong> ({selectedDoc.documentType}).
              Esta ação gravará uma transação pública de revogação irrevogável no Smart Contract.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Justificativa da Revogação (Obrigatório)
                </label>
                <textarea
                  required
                  rows={3}
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="Ex: Cancelamento de matrícula por inadimplência documental / Erro de dados cadastrais"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={revoking || revocationReason.trim().length < 5}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {revoking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Confirmar Revogação On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
