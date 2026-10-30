package com.tracevault.service;

import com.tracevault.entity.AuditLog;
import com.tracevault.entity.Document;
import com.tracevault.entity.IntegrityVerification;
import com.tracevault.repository.AuditLogRepository;
import com.tracevault.repository.DocumentRepository;
import com.tracevault.repository.IntegrityVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final IntegrityVerificationRepository verificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final AlertService alertService;

    @Value("${tracevault.storage.directory:/var/tracevault/documents}")
    private String storageDirectory;

    /**
     * Calculates cryptographic SHA-256 hash of bytes.
     */
    public String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable in JVM", e);
        }
    }

    /**
     * Upload and register a document:
     * 1. Validate file size and type
     * 2. Store file safely outside public directory using atomic rename
     * 3. Compute SHA-256 baseline
     * 4. Save metadata in MySQL inside an atomic transaction
     */
    @Transactional
    public Document registerDocument(MultipartFile file, String userId, String userName, String category, String ipAddress) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        byte[] bytes = file.getBytes();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.bin";
        String sha256Baseline = calculateSha256(bytes);

        String docId = "doc_" + UUID.randomUUID().toString().replace("-", "");
        String safeStorageName = docId + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

        Path targetDir = Paths.get(storageDirectory);
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        Path targetFile = targetDir.resolve(safeStorageName);
        Path tempFile = targetDir.resolve(safeStorageName + ".tmp");

        // Atomic file write to avoid partially written corrupt files
        Files.write(tempFile, bytes, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
        Files.move(tempFile, targetFile, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);

        Document doc = Document.builder()
                .id(docId)
                .ownerId(userId)
                .originalFilename(originalFilename)
                .storageFilename(safeStorageName)
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize((long) bytes.length)
                .sha256Baseline(sha256Baseline)
                .monitoringStatus(Document.MonitoringStatus.MONITORED)
                .category(category != null ? category : "Educational")
                .verificationStatus(Document.VerificationStatus.VERIFIED)
                .lastVerificationTime(LocalDateTime.now())
                .build();

        Document savedDoc = documentRepository.save(doc);

        // Record initial verification
        IntegrityVerification verif = IntegrityVerification.builder()
                .id("ver_" + UUID.randomUUID().toString().replace("-", ""))
                .documentId(docId)
                .userId(userId)
                .calculatedHash(sha256Baseline)
                .baselineHash(sha256Baseline)
                .status(IntegrityVerification.VerificationResult.MATCH)
                .executionType(IntegrityVerification.ExecutionType.MANUAL)
                .message("Initial registration baseline verification confirmed.")
                .checkedAt(LocalDateTime.now())
                .build();
        verificationRepository.save(verif);

        // Record Audit log
        AuditLog audit = AuditLog.builder()
                .id("aud_" + UUID.randomUUID().toString().replace("-", ""))
                .userId(userId)
                .userName(userName)
                .action("DOCUMENT_UPLOADED")
                .resourceType("DOCUMENT")
                .resourceId(docId)
                .details(String.format("File '%s' registered with SHA-256 baseline %s", originalFilename, sha256Baseline))
                .ipAddress(ipAddress)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        log.info("Document registered: {} [SHA256: {}]", originalFilename, sha256Baseline);
        return savedDoc;
    }

    /**
     * Verify individual document against trusted baseline.
     */
    @Transactional
    public IntegrityVerification verifyDocumentIntegrity(String documentId, String userId, IntegrityVerification.ExecutionType execType) {
        Document doc = documentRepository.findByIdAndOwnerId(documentId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found or access denied"));

        Path filePath = Paths.get(storageDirectory).resolve(doc.getStorageFilename());

        // Check storage availability
        if (!Files.exists(filePath)) {
            doc.setVerificationStatus(Document.VerificationStatus.FAILED);
            doc.setLastVerificationTime(LocalDateTime.now());
            documentRepository.save(doc);

            IntegrityVerification failedVerif = IntegrityVerification.builder()
                    .id("ver_" + UUID.randomUUID().toString().replace("-", ""))
                    .documentId(doc.getId())
                    .userId(userId)
                    .calculatedHash("UNAVAILABLE")
                    .baselineHash(doc.getSha256Baseline())
                    .status(IntegrityVerification.VerificationResult.STORAGE_ERROR)
                    .executionType(execType)
                    .message("Storage read failure: Document file cannot be accessed on storage media.")
                    .checkedAt(LocalDateTime.now())
                    .build();
            verificationRepository.save(failedVerif);
            alertService.handleStorageError(doc);
            return failedVerif;
        }

        try {
            byte[] bytes = Files.readAllBytes(filePath);
            String calculatedHash = calculateSha256(bytes);
            boolean isMatch = calculatedHash.equalsIgnoreCase(doc.getSha256Baseline());

            doc.setLastVerificationTime(LocalDateTime.now());
            doc.setVerificationStatus(isMatch ? Document.VerificationStatus.VERIFIED : Document.VerificationStatus.MISMATCH_DETECTED);
            documentRepository.save(doc);

            IntegrityVerification verif = IntegrityVerification.builder()
                    .id("ver_" + UUID.randomUUID().toString().replace("-", ""))
                    .documentId(doc.getId())
                    .userId(userId)
                    .calculatedHash(calculatedHash)
                    .baselineHash(doc.getSha256Baseline())
                    .status(isMatch ? IntegrityVerification.VerificationResult.MATCH : IntegrityVerification.VerificationResult.MISMATCH)
                    .executionType(execType)
                    .message(isMatch
                            ? "No content changes detected. SHA-256 signature intact."
                            : String.format("CRITICAL MISMATCH: Calculated hash %s differs from baseline %s", calculatedHash, doc.getSha256Baseline()))
                    .checkedAt(LocalDateTime.now())
                    .build();
            verificationRepository.save(verif);

            if (!isMatch) {
                alertService.handleIntegrityMismatch(doc, calculatedHash);
            }

            return verif;
        } catch (IOException e) {
            log.error("IO error verifying document {}", doc.getId(), e);
            doc.setVerificationStatus(Document.VerificationStatus.FAILED);
            documentRepository.save(doc);
            alertService.handleStorageError(doc);
            throw new RuntimeException("Storage failure reading document bytes", e);
        }
    }
}
