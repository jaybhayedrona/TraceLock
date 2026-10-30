package com.tracevault.controller;

import com.tracevault.entity.*;
import com.tracevault.repository.DocumentAuditRecordRepository;
import com.tracevault.repository.DocumentRepository;
import com.tracevault.repository.DocumentSignatureRepository;
import com.tracevault.repository.DocumentVersionRepository;
import com.tracevault.repository.UserRepository;
import com.tracevault.service.DigitalSignatureService;
import com.tracevault.service.DocumentAuditService;
import com.tracevault.service.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final DigitalSignatureService signatureService;
    private final DocumentAuditService auditService;
    private final DocumentSignatureRepository signatureRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentAuditRecordRepository auditRecordRepository;
    private final UserRepository userRepository;

    @Value("${tracevault.storage.directory:/var/tracevault/documents}")
    private String storageDirectory;

    @GetMapping
    public ResponseEntity<List<Document>> getUserDocuments(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        String uid = userId != null ? userId : "usr_demo_001";
        return ResponseEntity.ok(documentRepository.findByOwnerIdOrderByCreatedAtDesc(uid));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "Educational") String category,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId,
            HttpServletRequest request
    ) {
        try {
            Document doc = documentService.registerDocument(
                    file,
                    userId,
                    "Authorized User",
                    category,
                    request.getRemoteAddr()
            );

            // Record version 1 in document versions
            DocumentVersion initialVersion = DocumentVersion.builder()
                    .id("ver_" + System.currentTimeMillis() + "_1")
                    .documentId(doc.getId())
                    .versionNumber(1)
                    .originalFilename(doc.getOriginalFilename())
                    .storageFilename(doc.getStorageFilename())
                    .fileSize(doc.getFileSize())
                    .sha256Hash(doc.getSha256Baseline())
                    .changeSummary("Initial document registration")
                    .isSigned(false)
                    .createdBy("Authorized User")
                    .createdAt(LocalDateTime.now())
                    .build();
            versionRepository.save(initialVersion);

            // Record tamper-evident audit record
            auditService.recordAudit(
                    doc.getId(),
                    doc.getOriginalFilename(),
                    1,
                    userId,
                    "Authorized User",
                    "DOCUMENT_UPLOADED",
                    "SUCCESS",
                    "File '" + doc.getOriginalFilename() + "' registered with baseline SHA-256: " + doc.getSha256Baseline(),
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(doc);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload processing failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyDocument(
            @PathVariable("id") String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId
    ) {
        IntegrityVerification verif = documentService.verifyDocumentIntegrity(
                id,
                userId,
                IntegrityVerification.ExecutionType.MANUAL
        );
        return ResponseEntity.ok(verif);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable("id") String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId,
            HttpServletRequest request
    ) {
        Document doc = documentRepository.findByIdAndOwnerId(id, userId).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        auditService.recordAudit(
                doc.getId(),
                doc.getOriginalFilename(),
                doc.getVersionNumber(),
                userId,
                "Authorized User",
                "DOCUMENT_DELETED",
                "SUCCESS",
                "Document '" + doc.getOriginalFilename() + "' deleted from repository.",
                request.getRemoteAddr()
        );

        documentRepository.delete(doc);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
    }

    // =========================================================================
    // DIGITAL SIGNATURES & AUDIT TRAIL ENDPOINTS
    // =========================================================================

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signDocument(
            @PathVariable("id") String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId
    ) {
        Document doc = documentRepository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        User user = userRepository.findById(userId).orElse(
                User.builder().id(userId).fullName("Authorized Signer").email("user@tracevault.org").role("ROLE_USER").build()
        );

        try {
            Path filePath = Paths.get(storageDirectory).resolve(doc.getStorageFilename());
            if (!Files.exists(filePath)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Document file missing from physical storage."));
            }
            byte[] fileBytes = Files.readAllBytes(filePath);

            DocumentSignature signature = signatureService.signDocument(doc, user, fileBytes);
            return ResponseEntity.ok(Map.of(
                    "message", "Document successfully signed with RSA-2048.",
                    "signature", signature,
                    "document", doc
            ));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Signing failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/verify-signature")
    public ResponseEntity<?> verifySignature(
            @PathVariable("id") String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId
    ) {
        Document doc = documentRepository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        User user = userRepository.findById(userId).orElse(
                User.builder().id(userId).fullName("Verifier User").email("user@tracevault.org").role("ROLE_USER").build()
        );

        try {
            Path filePath = Paths.get(storageDirectory).resolve(doc.getStorageFilename());
            if (!Files.exists(filePath)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Document file missing from physical storage."));
            }
            byte[] fileBytes = Files.readAllBytes(filePath);

            DigitalSignatureService.VerificationResult result = signatureService.verifySignature(doc, user, fileBytes);
            return ResponseEntity.ok(Map.of(
                    "status", result.isMatch() ? "VALID" : "INVALID",
                    "isMatch", result.isMatch(),
                    "message", result.message(),
                    "signature", result.signature() != null ? result.signature() : Map.of(),
                    "currentHash", result.currentHash() != null ? result.currentHash() : "",
                    "signedHash", result.signedHash() != null ? result.signedHash() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Verification failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/signatures")
    public ResponseEntity<?> getSignatures(@PathVariable("id") String id) {
        return ResponseEntity.ok(Map.of("signatures", signatureRepository.findByDocumentIdOrderBySignedAtDesc(id)));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<?> getVersions(@PathVariable("id") String id) {
        return ResponseEntity.ok(Map.of("versions", versionRepository.findByDocumentIdOrderByVersionNumberAsc(id)));
    }

    @PostMapping("/{id}/versions")
    public ResponseEntity<?> uploadNewVersion(
            @PathVariable("id") String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "changeSummary", defaultValue = "Uploaded updated version") String changeSummary,
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId,
            HttpServletRequest request
    ) {
        Document doc = documentRepository.findByIdAndOwnerId(id, userId).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] bytes = file.getBytes();
            String sha256 = documentService.calculateSha256(bytes);
            int newVersionNum = (doc.getVersionNumber() != null ? doc.getVersionNumber() : 1) + 1;
            String newStorageName = doc.getId() + "_v" + newVersionNum + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");

            Path targetFile = Paths.get(storageDirectory).resolve(newStorageName);
            Files.write(targetFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.WRITE);

            DocumentVersion version = DocumentVersion.builder()
                    .id("ver_" + System.currentTimeMillis() + "_" + newVersionNum)
                    .documentId(doc.getId())
                    .versionNumber(newVersionNum)
                    .originalFilename(file.getOriginalFilename())
                    .storageFilename(newStorageName)
                    .fileSize((long) bytes.length)
                    .sha256Hash(sha256)
                    .changeSummary(changeSummary)
                    .isSigned(false)
                    .createdBy("Authorized User")
                    .createdAt(LocalDateTime.now())
                    .build();
            versionRepository.save(version);

            // Update document active pointer, setting signatureStatus to UNSIGNED for separate signing
            doc.setVersionNumber(newVersionNum);
            doc.setOriginalFilename(file.getOriginalFilename());
            doc.setStorageFilename(newStorageName);
            doc.setFileSize((long) bytes.length);
            doc.setSha256Baseline(sha256);
            doc.setVerificationStatus(Document.VerificationStatus.VERIFIED);
            doc.setSignatureStatus(Document.SignatureStatus.UNSIGNED);
            doc.setLastVerificationTime(LocalDateTime.now());
            documentRepository.save(doc);

            auditService.recordAudit(
                    doc.getId(),
                    doc.getOriginalFilename(),
                    newVersionNum,
                    userId,
                    "Authorized User",
                    "DOCUMENT_VERSION_CREATED",
                    "SUCCESS",
                    "Created version " + newVersionNum + " (" + changeSummary + "). Previous version signature preserved.",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("document", doc, "version", version));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Version upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<?> getAuditTrail(@PathVariable("id") String id) {
        return ResponseEntity.ok(Map.of("records", auditRecordRepository.findByDocumentIdOrderByTimestampAsc(id)));
    }

    @PostMapping("/{id}/audit-trail/verify-chain")
    public ResponseEntity<?> verifyAuditChain(@PathVariable("id") String id) {
        return ResponseEntity.ok(auditService.verifyChain(id));
    }
}
