import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { env } from "../config/env.js";

// Standard ABI for AcademicDocumentRegistry
const DEFAULT_ABI = [
  "function owner() view returns (address)",
  "function authorizedIssuers(address) view returns (bool)",
  "function registerDocument(bytes32 _documentHash, string _studentName, string _studentId, string _documentType, string _institutionName) external",
  "function revokeDocument(bytes32 _documentHash, string _reason) external",
  "function verifyDocument(bytes32 _documentHash) view returns (bool exists, bool isValid, string studentName, string studentId, string documentType, string institutionName, address issuer, uint256 issuanceDate, bool isRevoked, uint256 revokedAt, string revocationReason)",
  "function isDocumentValid(bytes32 _documentHash) view returns (bool exists, bool isValid)",
  "function getDocumentCount() view returns (uint256)",
  "function getDocumentHashByIndex(uint256 index) view returns (bytes32)",
  "event DocumentRegistered(bytes32 indexed documentHash, string studentId, string documentType, address indexed issuer, uint256 timestamp)",
  "event DocumentRevoked(bytes32 indexed documentHash, address indexed revoker, string reason, uint256 timestamp)"
];

export interface OnChainVerificationResult {
  exists: boolean;
  isValid: boolean;
  studentName: string;
  studentId: string;
  documentType: string;
  institutionName: string;
  issuerAddress: string;
  issuanceDate: Date | null;
  isRevoked: boolean;
  revokedAt: Date | null;
  revocationReason: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contractAddress: string = "";
  private contract: ethers.Contract | null = null;
  private abi: any[] = DEFAULT_ABI;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
    this.wallet = new ethers.Wallet(env.RELAYER_PRIVATE_KEY, this.provider);
    this.resolveContractDeployment();
  }

  public resolveContractDeployment() {
    if (env.CONTRACT_ADDRESS && ethers.isAddress(env.CONTRACT_ADDRESS)) {
      this.contractAddress = env.CONTRACT_ADDRESS;
    } else {
      // Look for generated contract-deployment.json
      const candidates = [
        path.join(process.cwd(), "src/config/contract-deployment.json"),
        path.join(process.cwd(), "../blockchain/deployed-contract.json"),
        path.join(process.cwd(), "contract-deployment.json")
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            const data = JSON.parse(fs.readFileSync(candidate, "utf-8"));
            if (data.address && ethers.isAddress(data.address)) {
              this.contractAddress = data.address;
              if (data.abi && Array.isArray(data.abi) && data.abi.length > 0) {
                this.abi = data.abi;
              }
              console.log(`[BlockchainService] Loaded contract at ${this.contractAddress} from ${candidate}`);
              break;
            }
          } catch (err) {
            console.warn(`[BlockchainService] Error reading candidate ${candidate}:`, err);
          }
        }
      }
    }

    if (this.contractAddress) {
      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
    }
  }

  public setContractAddress(address: string) {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid contract address: ${address}`);
    }
    this.contractAddress = address;
    this.contract = new ethers.Contract(address, this.abi, this.wallet);
  }

  public getContractAddress(): string {
    if (!this.contractAddress) {
      this.resolveContractDeployment();
    }
    return this.contractAddress;
  }

  public getRelayerAddress(): string {
    return this.wallet.address;
  }

  public async isReady(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber >= 0 && !!this.contractAddress;
    } catch {
      return false;
    }
  }

  public async getNetworkInfo() {
    this.resolveContractDeployment();
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const balanceWei = await this.provider.getBalance(this.wallet.address);
      let documentCount = 0;

      if (this.contract) {
        try {
          const count = await this.contract.getDocumentCount();
          documentCount = Number(count);
        } catch {
          // Ignore if contract call fails
        }
      }

      return {
        connected: true,
        chainId: Number(network.chainId),
        blockNumber,
        relayerAddress: this.wallet.address,
        relayerBalanceEth: ethers.formatEther(balanceWei),
        contractAddress: this.contractAddress,
        documentsOnChain: documentCount
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error?.message || "Unable to reach blockchain node",
        contractAddress: this.contractAddress,
        relayerAddress: this.wallet.address
      };
    }
  }

  public formatHashToBytes32(hexHash: string): string {
    const clean = hexHash.replace(/^0x/, "").toLowerCase();
    if (clean.length !== 64) {
      throw new Error(`Invalid SHA-256 hash length (${clean.length}). Expected 64 hex characters.`);
    }
    return "0x" + clean;
  }

  private async executeTxWithRetry(
    fn: (nonce: number) => Promise<ethers.ContractTransactionResponse>
  ): Promise<ethers.ContractTransactionReceipt> {
    let retries = 3;
    let lastError: any = null;

    while (retries > 0) {
      try {
        const nonce = await this.provider.getTransactionCount(this.wallet.address, "latest");
        const tx = await fn(nonce);
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) {
          throw new Error("Blockchain transaction failed to execute");
        }
        return receipt;
      } catch (error: any) {
        lastError = error;
        if (
          error?.message?.includes("Nonce") ||
          error?.code === "NONCE_EXPIRED" ||
          error?.info?.error?.message?.includes("Nonce")
        ) {
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error("Transaction execution failed after retries");
  }

  public async registerDocument(
    documentHashHex: string,
    studentName: string,
    studentId: string,
    documentType: string,
    institutionName: string
  ): Promise<{ txHash: string; blockNumber: number; gasUsed: string }> {
    if (!this.contract) {
      this.resolveContractDeployment();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed or address is not configured");
      }
    }

    const formattedHash = this.formatHashToBytes32(documentHashHex);

    const receipt = await this.executeTxWithRetry((nonce) =>
      this.contract!.registerDocument(
        formattedHash,
        studentName,
        studentId,
        documentType,
        institutionName,
        { nonce }
      )
    );

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  public async revokeDocument(
    documentHashHex: string,
    reason: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.contract) {
      this.resolveContractDeployment();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed or address is not configured");
      }
    }

    const formattedHash = this.formatHashToBytes32(documentHashHex);

    const receipt = await this.executeTxWithRetry((nonce) =>
      this.contract!.revokeDocument(formattedHash, reason, { nonce })
    );

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  public async verifyDocument(documentHashHex: string): Promise<OnChainVerificationResult> {
    if (!this.contract) {
      this.resolveContractDeployment();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed or address is not configured");
      }
    }

    const formattedHash = this.formatHashToBytes32(documentHashHex);
    const res = await this.contract.verifyDocument(formattedHash);

    const exists: boolean = res[0];
    const isValid: boolean = res[1];
    const studentName: string = res[2];
    const studentId: string = res[3];
    const documentType: string = res[4];
    const institutionName: string = res[5];
    const issuerAddress: string = res[6];
    const issuanceTimestamp = Number(res[7]);
    const isRevoked: boolean = res[8];
    const revokedTimestamp = Number(res[9]);
    const revocationReason: string = res[10];

    return {
      exists,
      isValid,
      studentName,
      studentId,
      documentType,
      institutionName,
      issuerAddress,
      issuanceDate: issuanceTimestamp > 0 ? new Date(issuanceTimestamp * 1000) : null,
      isRevoked,
      revokedAt: revokedTimestamp > 0 ? new Date(revokedTimestamp * 1000) : null,
      revocationReason
    };
  }
}

export const blockchainService = new BlockchainService();
