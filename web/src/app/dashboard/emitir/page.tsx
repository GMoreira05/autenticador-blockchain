"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FilePlus,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { calculateFileSha256, formatBytes, truncateHash } from "@/utils/crypto";
import { registerDocumentFile } from "@/utils/api";

const DOCUMENT_TYPES = [
  "Diploma de Bacharelado",
  "Diploma de Licenciatura",
  "Certificado de Conclusão de Curso",
  "Certificado de Pós-Graduação Lato Sensu",
  "Histórico Escolar Oficial",
  "Declaração de Matrícula Regular",
  "Declaração de Conclusão de Disciplinas",
];

export default function IssueDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [customDocType, setCustomDocType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setSuccessData(null);
    setFile(selectedFile);

    try {
      const hash = await calculateFileSha256(selectedFile);
      setComputedHash(hash);
    } catch (err: any) {
      setError("Erro ao calcular hash criptográfico do arquivo.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecione um arquivo acadêmico para emissão.");
      return;
    }
    if (!studentName.trim() || !studentId.trim()) {
      setError("Por favor, preencha o nome do aluno e o número de matrícula.");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const finalDocType = documentType === "Outro" ? customDocType : documentType;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentName", studentName.trim());
      formData.append("studentId", studentId.trim());
      formData.append("documentType", finalDocType.trim());

      const response = await registerDocumentFile(formData, token);
      setSuccessData(response);
      // Reset form
      setFile(null);
      setComputedHash("");
      setStudentName("");
      setStudentId("");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar documento na blockchain.");
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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Emitir e Ancorar Documento</h2>
            <p className="text-xs text-slate-500">
              Registre a prova de integridade na blockchain com Zero-Storage (arquivo não fica no servidor)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Erro na Emissão</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {successData && (
          <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl">
            <div className="flex items-start gap-3 pb-4 border-b border-emerald-200 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Documento Ancorado com Sucesso!</h3>
                <p className="text-xs text-emerald-800">
                  O hash criptográfico foi registrado imutavelmente na blockchain.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 p-3 rounded-xl border border-emerald-200">
                <span className="font-semibold text-slate-600">Hash SHA-256:</span>
                <div className="flex items-center gap-2 font-mono text-slate-800">
                  <span>0x{successData.record.documentHash}</span>
                  <button
                    onClick={() => copyToClipboard("0x" + successData.record.documentHash, "hash")}
                    className="hover:text-blue-600"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 p-3 rounded-xl border border-emerald-200">
                <span className="font-semibold text-slate-600">Transação Blockchain (TxHash):</span>
                <div className="flex items-center gap-2 font-mono text-slate-800">
                  <span>{truncateHash(successData.blockchain.txHash, 10, 10)}</span>
                  <button
                    onClick={() => copyToClipboard(successData.blockchain.txHash, "tx")}
                    className="hover:text-blue-600"
                  >
                    {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between bg-white/80 p-3 rounded-xl border border-emerald-200 text-slate-700">
                <span className="font-semibold">Bloco Minerado:</span>
                <span className="font-mono font-bold text-emerald-700">#{successData.blockchain.blockNumber}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-200 flex justify-end">
              <Link
                href={`/?hash=${successData.record.documentHash}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verificar no Portal Público</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Arquivo do Documento (PDF Oficial)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                {file ? file.name : "Clique para selecionar o PDF ou arraste aqui"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {file
                  ? `${formatBytes(file.size)} • Pronto para cálculo em memória`
                  : "PDF assinado ou documento acadêmico oficial"}
              </div>

              {computedHash && (
                <div className="mt-4 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs font-mono text-blue-900 break-all text-left">
                  <span className="font-bold text-blue-700 block mb-0.5">Hash SHA-256 Calculado:</span>
                  0x{computedHash}
                </div>
              )}
            </div>
          </div>

          {/* Student & Document Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Completo do Aluno(a)
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ex: Gabriel Henrique Silva"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Matrícula / Registro Acadêmico (RA)
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Ex: RA-20240987"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo do Documento Acadêmico
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value="Outro">Outro (especificar)</option>
            </select>

            {documentType === "Outro" && (
              <input
                type="text"
                required
                value={customDocType}
                onChange={(e) => setCustomDocType(e.target.value)}
                placeholder="Ex: Declaração Especial de Conclusão"
                className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando Transação para Blockchain...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Registrar e Ancorar na Blockchain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
