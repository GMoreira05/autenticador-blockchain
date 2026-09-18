# Autenticador de Documentos Acadêmicos Baseado em Blockchain (Zero-Storage)

> Sistema distribuído e desacoplado para comprovação matemática de autenticidade, integridade e temporalidade de diplomas, certificados e históricos acadêmicos com conformidade estrita à LGPD (Zero-Storage).

---

## 🏛️ Visão Geral e Arquitetura

O sistema adota uma **arquitetura de microsserviços desacoplada e modular**, dividida em 3 projetos independentes dentro do repositório:

1. **`blockchain`**: Nó local Ethereum (Hardhat) com Smart Contract Solidity (`AcademicDocumentRegistry.sol`), suíte de testes com Chai/Ethers e scripts automatizados de deployment e exportação de metadados. Custo de transação **R$ 0,00** através de rede local autominada.
2. **`api`**: Microsserviço de alto desempenho desenvolvido em **Node.js com Fastify e TypeScript**, documentação OpenAPI/Swagger, autenticação JWT, integração com PostgreSQL via **Prisma ORM** e comunicação RPC via **Ethers.js**.
3. **`web`**: Frontend moderno em **Next.js (App Router), TypeScript e Tailwind CSS**, com cálculo criptográfico de hash **100% no navegador (Web Crypto API)** e painel administrativo da secretaria acadêmica.

---

## 🛡️ O Modelo Zero-Storage (LGPD e Privacidade)

Uma das maiores vulnerabilidades em sistemas acadêmicos tradicionais é o armazenamento desnecessário de arquivos PDF contendo dados pessoais (RG, CPF, notas, histórico, filiação).

### Como o CertChain resolve isso:
* **Upload e Verificação Pública no Navegador**: Ao arrastar um arquivo PDF na tela inicial, o navegador calcula o hash SHA-256 localmente via `window.crypto.subtle.digest("SHA-256", buffer)`. O documento **nunca sai da máquina do usuário** para fins de verificação.
* **Emissão pela Secretaria com Streaming em Memória**: Ao registrar um documento oficial, o arquivo é enviado como stream HTTP (`@fastify/multipart`). O servidor calcula o hash criptográfico **chunk por chunk diretamente na memória RAM**, descartando os dados binários imediatamente após o encerramento do stream.
* **O arquivo físico NUNCA é salvo no disco rígido e NUNCA é salvo no banco de dados**.
* **Imutabilidade Matemática**: Na blockchain, apenas o hash de 32 bytes (`bytes32`), o carimbo temporal de bloco (`block.timestamp`), os identificadores públicos e o endereço da instituição emissora são gravados.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js v18+ ou v22+
* Docker e Docker Compose

---

### Passo 1: Iniciar o Banco de Dados PostgreSQL
O banco roda em container isolado via Docker (porta mapeada para `5434` para evitar conflitos de porta):
```bash
npm run docker:db:up
```

---

### Passo 2: Executar as Migrações e o Seed do Banco
```bash
npm run db:migrate
npm run db:seed
```
* **Credenciais pré-configuradas:**
  * **Secretaria (Staff/Issuer):** `secretaria@universidade.edu.br` | Senha: `Secretaria@123456`
  * **Administrador Geral:** `admin@universidade.edu.br` | Senha: `Admin@123456`

---

### Passo 3: Iniciar o Nó Blockchain Local e Fazer o Deploy
Abra um terminal e execute o nó Hardhat:
```bash
npm run dev:blockchain
```
Em outro terminal (ou após iniciar o nó), faça o deploy do contrato inteligente:
```bash
npm run deploy:blockchain
```
*O script compila o contrato `AcademicDocumentRegistry.sol`, realiza o deploy e salva automaticamente a ABI e o endereço do contrato para a `api` e para a `web`.*

---

### Passo 4: Iniciar os Serviços (API e Web)
Você pode rodar tudo em paralelo com um único comando:
```bash
npm run dev
```
Ou rodar individualmente:
* **API Fastify:** `npm run dev:api` (Porta `3001` - Swagger em `http://localhost:3001/docs`)
* **Web Next.js:** `npm run dev:web` (Porta `3000` - Interface em `http://localhost:3000`)

---

## 🧪 Testes Automatizados

### 1. Testes Unitários dos Smart Contracts (Solidity + Hardhat)
Testa controle de acesso, emissão, prevenção de duplicidade, revogação com justificativa e eventos:
```bash
npm --workspace=blockchain test
```

### 2. Testes da API (Vitest + Fastify Inject)
Testa o hasher de streaming zero-storage, rotas de login JWT, endpoints de verificação e métricas:
```bash
npm --workspace=api test
```

### 3. Teste Integrado de Ponta a Ponta (E2E)
Executa todo o ciclo de vida de um documento acadêmico (Geração em memória -> Emissão na Blockchain -> Verificação de Autenticidade -> Simulação de Adulteração de 1 Byte -> Revogação Administrativa -> Verificação de Revogação):
```bash
npm run test:e2e
```

---

## 📜 Especificação do Smart Contract (`AcademicDocumentRegistry.sol`)

| Função | Visibilidade | Descrição |
|---|---|---|
| `registerDocument(...)` | `onlyIssuer` | Ancola o hash SHA-256 (`bytes32`), aluno, matrícula, tipo e universidade. |
| `revokeDocument(...)` | `onlyIssuer` | Revoga um documento emitido mediante justificativa administrativa formal. |
| `verifyDocument(bytes32)` | `view` (Pública) | Retorna todos os metadados do documento e status (`exists`, `isValid`). |
| `isDocumentValid(bytes32)` | `view` (Pública) | Retorna booleano rápido indicando se o documento existe e não foi revogado. |
| `getDocumentCount()` | `view` (Pública) | Retorna o total de documentos registrados na rede. |
| `authorizeIssuer(address)` | `onlyOwner` | Autoriza uma nova carteira/secretaria a registrar documentos. |
| `deauthorizeIssuer(address)` | `onlyOwner` | Desautoriza uma carteira emissora. |

---

## 📁 Estrutura de Diretórios

```
autenticador-blockchain/
├── docker-compose.yml              # PostgreSQL isolado na porta 5434
├── package.json                    # Monorepo / Workspaces orchestrator
├── scripts/
│   └── test-e2e.mjs               # Suíte de teste integrada ponta a ponta
├── blockchain/                     # Projeto Hardhat Standalone
│   ├── contracts/
│   │   └── AcademicDocumentRegistry.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── AcademicDocumentRegistry.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── api/                            # Microsserviço Fastify Standalone
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── blockchain/             # Ethers.js integration & relayer
│   │   ├── config/                 # Zod validation & env
│   │   ├── modules/
│   │   │   ├── auth/               # JWT authentication & users
│   │   │   ├── documents/          # Zero-storage stream registration & verify
│   │   │   └── stats/              # Blockchain & document metrics
│   │   ├── plugins/                # Fastify plugins
│   │   ├── utils/                  # SHA-256 stream hasher
│   │   ├── app.ts
│   │   └── server.ts
│   └── test/                       # Vitest test suite
└── web/                            # Aplicação Next.js 15 Standalone
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            # Portal público de verificação (Web Crypto)
    │   │   ├── como-funciona/      # Fundamentação técnica & LGPD
    │   │   ├── login/              # Login institucional da secretaria
    │   │   └── dashboard/          # Gestão, emissão e auditoria
    │   ├── components/             # Navbar, Footer e componentes de UI
    │   └── utils/                  # Client-side crypto & API helpers
    └── package.json
```
