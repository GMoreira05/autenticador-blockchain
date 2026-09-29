import { PrismaClient, DocumentStatus } from "@prisma/client";
import { BlockchainService, blockchainService } from "../../blockchain/blockchain.service.js";
import { RegisterHashInput, RevokeDocumentInput, ListDocumentsQuery } from "./documents.schemas.js";

export class DocumentsService {
  constructor(
    private prisma: PrismaClient,
    private chainService: BlockchainService = blockchainService
  ) {}

  /**
   * Registers a document hash onto the blockchain and stores metadata in DB.
   * Zero-Storage Guarantee: File contents are never stored!
   */
  async registerDocument(
    input: RegisterHashInput,
    user: { id: string; institutionId: string }
  ) {
    const cleanHash = input.documentHash.replace(/^0x/, "").toLowerCase();

    // Check if already registered in DB
    const existingDb = await this.prisma.documentRecord.findUnique({
      where: { documentHash: cleanHash },
    });
    if (existingDb) {
      throw new Error("Este documento já foi registrado anteriormente no sistema.");
    }

    // Check if institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });
    if (!institution) {
      throw new Error("Instituição não encontrada");
    }

    // 1. Submit on-chain proof
    const onChainResult = await this.chainService.registerDocument(
      cleanHash,
      input.studentName,
      input.studentId,
      input.documentType,
      institution.name
    );

    // 2. Save metadata in DB
    const record = await this.prisma.documentRecord.create({
      data: {
        documentHash: cleanHash,
        studentName: input.studentName,
        studentId: input.studentId,
        documentType: input.documentType,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        blockchainTxHash: onChainResult.txHash,
        blockNumber: onChainResult.blockNumber,
        issuerAddress: this.chainService.getRelayerAddress(),
        status: DocumentStatus.ACTIVE,
        institutionId: institution.id,
        issuedById: user.id,
      },
      include: {
        institution: true,
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 3. Create immutable audit log
    await this.prisma.auditLog.create({
      data: {
        action: "DOCUMENT_REGISTERED",
        documentHash: cleanHash,
        userId: user.id,
        institutionId: institution.id,
        details: {
          txHash: onChainResult.txHash,
          blockNumber: onChainResult.blockNumber,
          gasUsed: onChainResult.gasUsed,
          studentId: input.studentId,
        },
      },
    });

    return {
      record,
      blockchain: {
        txHash: onChainResult.txHash,
        blockNumber: onChainResult.blockNumber,
        contractAddress: this.chainService.getContractAddress(),
      },
    };
  }

  /**
   * Revokes a registered document on-chain and updates DB
   */
  async revokeDocument(
    documentHashHex: string,
    input: RevokeDocumentInput,
    user: { id: string; institutionId: string; role?: string }
  ) {
    const cleanHash = documentHashHex.replace(/^0x/, "").toLowerCase();

    const record = await this.prisma.documentRecord.findUnique({
      where: { documentHash: cleanHash },
    });

    if (!record) {
      throw new Error("Documento não encontrado no sistema");
    }

    // Broken Access Control prevention: only the issuing institution (or ADMIN) can revoke
    if (user.role !== "ADMIN" && record.institutionId !== user.institutionId) {
      throw new Error("Acesso negado. Você só pode revogar documentos da sua própria instituição.");
    }

    if (record.status === DocumentStatus.REVOKED) {
      throw new Error("Este documento já foi revogado");
    }

    // 1. Revoke on blockchain
    const onChainResult = await this.chainService.revokeDocument(cleanHash, input.reason);

    // 2. Update DB
    const updated = await this.prisma.documentRecord.update({
      where: { documentHash: cleanHash },
      data: {
        status: DocumentStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: input.reason,
      },
      include: {
        institution: true,
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 3. Audit log
    await this.prisma.auditLog.create({
      data: {
        action: "DOCUMENT_REVOKED",
        documentHash: cleanHash,
        userId: user.id,
        institutionId: user.institutionId,
        details: {
          reason: input.reason,
          txHash: onChainResult.txHash,
          blockNumber: onChainResult.blockNumber,
        },
      },
    });

    return {
      record: updated,
      blockchain: {
        txHash: onChainResult.txHash,
        blockNumber: onChainResult.blockNumber,
      },
    };
  }

  /**
   * Public verification against blockchain + DB
   */
  async verifyDocument(documentHashHex: string) {
    const cleanHash = documentHashHex.replace(/^0x/, "").toLowerCase();

    // Query on-chain ground truth
    const onChain = await this.chainService.verifyDocument(cleanHash);

    // Query metadata from DB (if present)
    const dbRecord = await this.prisma.documentRecord.findUnique({
      where: { documentHash: cleanHash },
      include: {
        institution: true,
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let status: "AUTHENTIC" | "REVOKED" | "NOT_FOUND" = "NOT_FOUND";
    if (onChain.exists) {
      status = onChain.isValid ? "AUTHENTIC" : "REVOKED";
    }

    return {
      status,
      hash: "0x" + cleanHash,
      onChain: {
        exists: onChain.exists,
        isValid: onChain.isValid,
        studentName: onChain.studentName,
        studentId: onChain.studentId,
        documentType: onChain.documentType,
        institutionName: onChain.institutionName,
        issuerAddress: onChain.issuerAddress,
        issuanceDate: onChain.issuanceDate,
        isRevoked: onChain.isRevoked,
        revokedAt: onChain.revokedAt,
        revocationReason: onChain.revocationReason,
      },
      offChain: dbRecord
        ? {
            fileName: dbRecord.fileName,
            fileSize: dbRecord.fileSize,
            mimeType: dbRecord.mimeType,
            institutionName: dbRecord.institution.name,
            institutionCode: dbRecord.institution.code,
            blockchainTxHash: dbRecord.blockchainTxHash,
            blockNumber: dbRecord.blockNumber,
            createdAt: dbRecord.createdAt,
          }
        : null,
      contractAddress: this.chainService.getContractAddress(),
      verifiedAt: new Date(),
    };
  }

  /**
   * List documents with filters and pagination
   */
  async listDocuments(query: ListDocumentsQuery, institutionId?: string) {
    const { page, limit, search, status, documentType } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }
    if (status) {
      where.status = status;
    }
    if (documentType) {
      where.documentType = { contains: documentType, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { documentHash: { contains: search.toLowerCase() } },
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, documents] = await Promise.all([
      this.prisma.documentRecord.count({ where }),
      this.prisma.documentRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          institution: { select: { id: true, name: true, code: true } },
          issuedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
