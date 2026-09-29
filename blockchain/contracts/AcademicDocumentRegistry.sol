// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AcademicDocumentRegistry
 * @dev Smart contract for academic document authenticity verification.
 * Only cryptographic hashes (SHA-256) and verifiable metadata are stored on-chain,
 * ensuring complete zero-storage of private document files.
 */
contract AcademicDocumentRegistry {
    struct DocumentRecord {
        bytes32 documentHash;
        string studentName;
        string studentId;
        string documentType;
        string institutionName;
        address issuer;
        uint256 issuanceDate;
        bool isRevoked;
        uint256 revokedAt;
        string revocationReason;
        bool exists;
    }

    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => DocumentRecord) private documents;
    bytes32[] private documentHashes;

    event DocumentRegistered(
        bytes32 indexed documentHash,
        string studentId,
        string documentType,
        address indexed issuer,
        uint256 timestamp
    );

    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed revoker,
        string reason,
        uint256 timestamp
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    modifier onlyIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "Caller is not an authorized document issuer"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    /**
     * @notice Authorizes a new issuer address.
     * @param _issuer Address to grant document issuance permissions.
     */
    function authorizeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        require(!authorizedIssuers[_issuer], "Issuer already authorized");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }

    /**
     * @notice Revokes issuance permissions from an address.
     * @param _issuer Address to revoke issuance permissions from.
     */
    function deauthorizeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "Issuer not currently authorized");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @notice Registers an academic document by its cryptographic hash.
     * @param _documentHash SHA-256 hash formatted as bytes32.
     * @param _studentName Full legal name of the student.
     * @param _studentId Registration or matriculation identifier.
     * @param _documentType Category of academic document (e.g., Diploma, Certificate).
     * @param _institutionName Name of the issuing academic institution.
     */
    function registerDocument(
        bytes32 _documentHash,
        string calldata _studentName,
        string calldata _studentId,
        string calldata _documentType,
        string calldata _institutionName
    ) external onlyIssuer {
        require(_documentHash != bytes32(0), "Document hash cannot be zero");
        require(!documents[_documentHash].exists, "Document hash already registered on-chain");
        require(bytes(_studentName).length > 0, "Student name is required");
        require(bytes(_studentId).length > 0, "Student ID is required");
        require(bytes(_documentType).length > 0, "Document type is required");
        require(bytes(_institutionName).length > 0, "Institution name is required");

        documents[_documentHash] = DocumentRecord({
            documentHash: _documentHash,
            studentName: _studentName,
            studentId: _studentId,
            documentType: _documentType,
            institutionName: _institutionName,
            issuer: msg.sender,
            issuanceDate: block.timestamp,
            isRevoked: false,
            revokedAt: 0,
            revocationReason: "",
            exists: true
        });

        documentHashes.push(_documentHash);

        emit DocumentRegistered(
            _documentHash,
            _studentId,
            _documentType,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Revokes a previously registered document.
     * @param _documentHash SHA-256 hash of the document to revoke.
     * @param _reason Administrative reason for the revocation.
     */
    function revokeDocument(bytes32 _documentHash, string calldata _reason) external onlyIssuer {
        require(documents[_documentHash].exists, "Document not found on-chain");
        require(!documents[_documentHash].isRevoked, "Document is already revoked");
        require(bytes(_reason).length > 0, "Revocation reason is required");

        DocumentRecord storage doc = documents[_documentHash];
        doc.isRevoked = true;
        doc.revokedAt = block.timestamp;
        doc.revocationReason = _reason;

        emit DocumentRevoked(_documentHash, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Verifies an academic document hash and retrieves complete on-chain metadata.
     * @param _documentHash SHA-256 hash to query.
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            string memory studentName,
            string memory studentId,
            string memory documentType,
            string memory institutionName,
            address issuer,
            uint256 issuanceDate,
            bool isRevoked,
            uint256 revokedAt,
            string memory revocationReason
        )
    {
        DocumentRecord memory doc = documents[_documentHash];
        if (!doc.exists) {
            return (false, false, "", "", "", "", address(0), 0, false, 0, "");
        }

        return (
            true,
            !doc.isRevoked,
            doc.studentName,
            doc.studentId,
            doc.documentType,
            doc.institutionName,
            doc.issuer,
            doc.issuanceDate,
            doc.isRevoked,
            doc.revokedAt,
            doc.revocationReason
        );
    }

    /**
     * @notice Quick boolean check for document validity.
     * @param _documentHash SHA-256 hash to check.
     */
    function isDocumentValid(bytes32 _documentHash)
        external
        view
        returns (bool exists, bool isValid)
    {
        DocumentRecord memory doc = documents[_documentHash];
        return (doc.exists, doc.exists && !doc.isRevoked);
    }

    /**
     * @notice Returns total number of registered documents.
     */
    function getDocumentCount() external view returns (uint256) {
        return documentHashes.length;
    }

    /**
     * @notice Returns document hash by sequential index.
     * @param index The array index.
     */
    function getDocumentHashByIndex(uint256 index) external view returns (bytes32) {
        require(index < documentHashes.length, "Index out of bounds");
        return documentHashes[index];
    }

    /**
     * @notice Transfers ownership of the registry to another address.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
        authorizedIssuers[_newOwner] = true;
    }
}
