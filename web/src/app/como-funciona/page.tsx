import { ShieldCheck, Hash, Database, Lock, EyeOff, Layers, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center mb-12">
        <span className="text-xs uppercase font-bold text-blue-600 tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Metodologia & Fundamentos
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
          Como Funciona o Autenticador Baseado em Blockchain
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
          Entenda como a combinação de funções hash criptográficas, a tecnologia blockchain
          e a arquitetura Zero-Storage garantem auditabilidade máxima com conformidade total à LGPD.
        </p>
      </div>

      {/* Pillars Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">1. Hash Criptográfico (SHA-256)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Qualquer documento acadêmico (PDF, imagem) é processado por uma função matemática unidirecional (SHA-256),
            gerando uma impressão digital única de 64 caracteres. Alterar uma única letra no documento modifica o hash por completo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <EyeOff className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">2. Zero-Storage (LGPD)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            O arquivo do aluno <strong>nunca é armazenado</strong> nos servidores ou na blockchain.
            Apenas a impressão digital matemática é registrada, protegendo dados pessoais e sensíveis contra vazamentos.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">3. Prova Imutável na Blockchain</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            O hash e os dados institucionais são ancorados em um Smart Contract. Uma vez minerado no bloco,
            o registro se torna matematicamente indelével, à prova de fraudes ou adulterações retroativas.
          </p>
        </div>
      </div>

      {/* Step by Step Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Ciclo de Vida do Documento Acadêmico
        </h2>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Emissão e Assinatura pela Secretaria</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                A instituição de ensino gera o documento (diploma ou certificado) em formato PDF e faz o upload pelo painel seguro.
                O sistema calcula o hash SHA-256 em memória (streaming in-memory) e envia uma transação assinada pela carteira da instituição para o Smart Contract.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Ancoragem no Smart Contract</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                O contrato inteligente grava: o hash do documento, nome do formando, matrícula, tipo do documento, carimbo temporal (timestamp de bloco) e endereço do emissor credenciado.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Validação Pública Instantânea</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Qualquer terceiro (empresas de RH, conselhos de classe, outras universidades) pode arrastar o arquivo PDF para o portal público.
                A API Web Crypto do próprio navegador calcula o hash do arquivo localmente e o compara com a blockchain. Se corresponder, o documento é 100% legítimo.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Mecanismo de Revogação Transparente</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Caso um certificado precise ser revogado (por erro cadastral ou decisão judicial), a instituição executa a revogação no Smart Contract com justificativa.
                A transação fica registrada no histórico e o portal passa a alertar que o documento está revogado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture diagram cards */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-md mb-12">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Comparativo de Segurança Arquitetural
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-red-500/30">
            <div className="font-bold text-red-400 mb-2">Abordagem Tradicional Vulnerável</div>
            <ul className="space-y-2 text-slate-300 text-xs list-disc list-inside">
              <li>Armazenamento de PDFs volumosos em discos ou bancos centralizados.</li>
              <li>Risco elevado de invasões, ransomware e vazamento de dados pessoais.</li>
              <li>Possibilidade de administradores mal-intencionados alterarem registros no banco.</li>
              <li>Validação depende da disponibilidade do servidor interno da escola.</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/30">
            <div className="font-bold text-emerald-400 mb-2">Abordagem CertChain com Blockchain</div>
            <ul className="space-y-2 text-slate-300 text-xs list-disc list-inside">
              <li><strong>Zero-Storage:</strong> Arquivos não ficam salvos; risco de vazamento reduzido a zero.</li>
              <li><strong>Imutabilidade Matemática:</strong> Ninguém (nem mesmo administradores) pode adulterar registros históricos.</li>
              <li><strong>Auditoria Pública Descentralizada:</strong> Qualquer cidadão ou empresa pode verificar a autenticidade 24/7.</li>
              <li><strong>Custo Zero de Infraestrutura:</strong> Otimizado para execução em redes de alta performance e nós locais.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          Testar Verificação de Documento Agora
        </Link>
      </div>
    </div>
  );
}
