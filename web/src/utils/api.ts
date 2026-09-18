const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface VerificationResponse {
  status: "AUTHENTIC" | "REVOKED" | "NOT_FOUND";
  hash: string;
  onChain: {
    exists: boolean;
    isValid: boolean;
    studentName: string;
    studentId: string;
    documentType: string;
    institutionName: string;
    issuerAddress: string;
    issuanceDate: string | null;
    isRevoked: boolean;
    revokedAt: string | null;
    revocationReason: string;
  };
  offChain: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    institutionName: string;
    institutionCode: string;
    blockchainTxHash: string;
    blockNumber: number;
    createdAt: string;
  } | null;
  contractAddress: string;
  verifiedAt: string;
}

export interface StatsResponse {
  stats: {
    totalDocuments: number;
    activeDocuments: number;
    revokedDocuments: number;
    institutions: number;
  };
  blockchain: {
    connected: boolean;
    chainId?: number;
    blockNumber?: number;
    relayerAddress?: string;
    relayerBalanceEth?: string;
    contractAddress?: string;
    documentsOnChain?: number;
    error?: string;
  };
  recentDocuments: Array<{
    id: string;
    documentHash: string;
    studentName: string;
    studentId: string;
    documentType: string;
    status: "ACTIVE" | "REVOKED";
    createdAt: string;
    blockNumber: number;
    blockchainTxHash: string;
    institution: { name: string };
  }>;
}

export async function verifyDocumentByHash(hash: string): Promise<VerificationResponse> {
  const clean = hash.replace(/^0x/, "");
  const res = await fetch(`${API_BASE_URL}/api/documents/verify/${clean}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Erro ao verificar documento");
  }
  return res.json();
}

export async function getPublicStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/stats`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Erro ao buscar estatísticas do sistema");
  }
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Falha no login");
  }
  return data;
}

export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Sessão expirada");
  }
  return res.json();
}

export async function registerDocumentFile(formData: FormData, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/documents/register-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Erro ao registrar documento");
  }
  return data;
}

export async function registerDocumentHash(payload: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/documents/register-hash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Erro ao registrar hash");
  }
  return data;
}

export async function revokeDocument(hash: string, reason: string, token: string) {
  const clean = hash.replace(/^0x/, "");
  const res = await fetch(`${API_BASE_URL}/api/documents/${clean}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Erro ao revogar documento");
  }
  return data;
}

export async function listDocuments(
  params: { page?: number; limit?: number; search?: string; status?: string; documentType?: string },
  token: string
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.documentType) query.set("documentType", params.documentType);

  const res = await fetch(`${API_BASE_URL}/api/documents?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Erro ao listar documentos");
  }
  return data;
}
