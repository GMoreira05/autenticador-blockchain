import { expect } from "chai";
import { ethers } from "hardhat";
import { AcademicDocumentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AcademicDocumentRegistry Contract", () => {
  let registry: AcademicDocumentRegistry;
  let owner: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  // Mock SHA-256 hash (32 bytes)
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("diploma-content-sample-1"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("diploma-content-sample-2"));

  beforeEach(async () => {
    [owner, issuer, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AcademicDocumentRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();

    // Authorize issuer
    await registry.authorizeIssuer(issuer.address);
  });

  describe("Deployment & Access Control", () => {
    it("should set deployer as owner and initial authorized issuer", async () => {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.authorizedIssuers(owner.address)).to.be.true;
      expect(await registry.authorizedIssuers(issuer.address)).to.be.true;
      expect(await registry.authorizedIssuers(unauthorized.address)).to.be.false;
    });

    it("should allow owner to authorize and deauthorize issuers", async () => {
      await expect(registry.authorizeIssuer(unauthorized.address))
        .to.emit(registry, "IssuerAuthorized")
        .withArgs(unauthorized.address);

      expect(await registry.authorizedIssuers(unauthorized.address)).to.be.true;

      await expect(registry.deauthorizeIssuer(unauthorized.address))
        .to.emit(registry, "IssuerRevoked")
        .withArgs(unauthorized.address);

      expect(await registry.authorizedIssuers(unauthorized.address)).to.be.false;
    });

    it("should prevent non-owner from managing issuers", async () => {
      await expect(
        registry.connect(unauthorized).authorizeIssuer(unauthorized.address)
      ).to.be.revertedWith("Only contract owner can perform this action");
    });
  });

  describe("Document Registration", () => {
    it("should register an academic document successfully", async () => {
      const tx = await registry
        .connect(issuer)
        .registerDocument(
          sampleHash,
          "Carlos Eduardo Santos",
          "RA-2024-9876",
          "Diploma de Bacharelado em Ciência da Computação",
          "Universidade Tecnológica Federal"
        );

      await expect(tx)
        .to.emit(registry, "DocumentRegistered")
        .withArgs(
          sampleHash,
          "RA-2024-9876",
          "Diploma de Bacharelado em Ciência da Computação",
          issuer.address,
          (await ethers.provider.getBlock("latest"))?.timestamp
        );

      const count = await registry.getDocumentCount();
      expect(count).to.equal(1n);
      expect(await registry.getDocumentHashByIndex(0)).to.equal(sampleHash);
    });

    it("should reject registration with empty hash or empty fields", async () => {
      await expect(
        registry
          .connect(issuer)
          .registerDocument(
            ethers.ZeroHash,
            "Carlos Eduardo",
            "RA-1234",
            "Certificado",
            "Universidade"
          )
      ).to.be.revertedWith("Document hash cannot be zero");

      await expect(
        registry
          .connect(issuer)
          .registerDocument(sampleHash, "", "RA-1234", "Certificado", "Universidade")
      ).to.be.revertedWith("Student name is required");

      await expect(
        registry
          .connect(issuer)
          .registerDocument(sampleHash, "Carlos Eduardo", "", "Certificado", "Universidade")
      ).to.be.revertedWith("Student ID is required");

      await expect(
        registry
          .connect(issuer)
          .registerDocument(sampleHash, "Carlos Eduardo", "RA-1234", "", "Universidade")
      ).to.be.revertedWith("Document type is required");

      await expect(
        registry
          .connect(issuer)
          .registerDocument(sampleHash, "Carlos Eduardo", "RA-1234", "Certificado", "")
      ).to.be.revertedWith("Institution name is required");
    });

    it("should prevent duplicate registration of same document hash", async () => {
      await registry
        .connect(issuer)
        .registerDocument(
          sampleHash,
          "Carlos Eduardo",
          "RA-1234",
          "Certificado",
          "Universidade"
        );

      await expect(
        registry
          .connect(issuer)
          .registerDocument(
            sampleHash,
            "Carlos Eduardo",
            "RA-1234",
            "Certificado",
            "Universidade"
          )
      ).to.be.revertedWith("Document hash already registered on-chain");
    });

    it("should prevent unauthorized addresses from registering documents", async () => {
      await expect(
        registry
          .connect(unauthorized)
          .registerDocument(
            sampleHash,
            "Carlos Eduardo",
            "RA-1234",
            "Certificado",
            "Universidade"
          )
      ).to.be.revertedWith("Caller is not an authorized document issuer");
    });
  });

  describe("Document Verification", () => {
    it("should return false for unregistered hash", async () => {
      const [exists, isValid] = await registry.isDocumentValid(sampleHash);
      expect(exists).to.be.false;
      expect(isValid).to.be.false;

      const record = await registry.verifyDocument(sampleHash);
      expect(record.exists).to.be.false;
      expect(record.isValid).to.be.false;
    });

    it("should verify valid registered document with complete metadata", async () => {
      await registry
        .connect(issuer)
        .registerDocument(
          sampleHash,
          "Ana Paula Ribeiro",
          "RA-2023-1122",
          "Histórico Escolar de Graduação",
          "Universidade Estadual"
        );

      const record = await registry.verifyDocument(sampleHash);
      expect(record.exists).to.be.true;
      expect(record.isValid).to.be.true;
      expect(record.studentName).to.equal("Ana Paula Ribeiro");
      expect(record.studentId).to.equal("RA-2023-1122");
      expect(record.documentType).to.equal("Histórico Escolar de Graduação");
      expect(record.institutionName).to.equal("Universidade Estadual");
      expect(record.issuer).to.equal(issuer.address);
      expect(record.isRevoked).to.be.false;
      expect(record.revocationReason).to.equal("");
    });
  });

  describe("Document Revocation", () => {
    beforeEach(async () => {
      await registry
        .connect(issuer)
        .registerDocument(
          sampleHash,
          "Marcos Vinicius Silva",
          "RA-2022-4455",
          "Certificado de Conclusão",
          "Instituto de Ensino Superior"
        );
    });

    it("should allow authorized issuer to revoke a document with reason", async () => {
      const reason = "Cancelamento administrativo por pendência documental";
      const tx = await registry.connect(issuer).revokeDocument(sampleHash, reason);

      await expect(tx)
        .to.emit(registry, "DocumentRevoked")
        .withArgs(
          sampleHash,
          issuer.address,
          reason,
          (await ethers.provider.getBlock("latest"))?.timestamp
        );

      const record = await registry.verifyDocument(sampleHash);
      expect(record.exists).to.be.true;
      expect(record.isValid).to.be.false;
      expect(record.isRevoked).to.be.true;
      expect(record.revocationReason).to.equal(reason);
      expect(record.revokedAt).to.be.greaterThan(0n);
    });

    it("should reject revoking an already revoked document", async () => {
      await registry.connect(issuer).revokeDocument(sampleHash, "Primeira revogação");

      await expect(
        registry.connect(issuer).revokeDocument(sampleHash, "Segunda revogação")
      ).to.be.revertedWith("Document is already revoked");
    });

    it("should reject revoking an unregistered document", async () => {
      await expect(
        registry.connect(issuer).revokeDocument(sampleHash2, "Documento não existe")
      ).to.be.revertedWith("Document not found on-chain");
    });

    it("should reject revocation by unauthorized user", async () => {
      await expect(
        registry.connect(unauthorized).revokeDocument(sampleHash, "Fraude")
      ).to.be.revertedWith("Caller is not an authorized document issuer");
    });
  });
});
