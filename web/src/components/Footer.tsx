import Link from "next/link";
import { Shield, Lock, Cpu, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">CertChain Acadêmico</span>
            </div>
            <p className="text-sm text-slate-500 max-w-md mb-4">
              Plataforma de prova de integridade e autenticação de documentos acadêmicos via Blockchain.
              Conformidade rigorosa com a LGPD através de modelo Zero-Storage (armazenamento zero de arquivos).
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Criptografia SHA-256
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-600" /> Smart Contracts
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-purple-600" /> Auditoria Pública
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Verificar Documento
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-blue-600 transition-colors">
                  Como Funciona a Blockchain
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Acesso Institucional (Staff)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  Painel da Secretaria
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Segurança e Privacidade</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Os arquivos submetidos para verificação são processados diretamente no cliente via Web Crypto API.
              Nenhum documento é enviado ou salvo no servidor.
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              ✓ Zero-Storage LGPD Compliant
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Autenticador de Documentos Baseado em Blockchain.
          </div>
          <div>
            Tecnologia descentralizada de código aberto para Instituições de Ensino Superior.
          </div>
        </div>
      </div>
    </footer>
  );
}
