package com.tracevault.service;

import com.tracevault.entity.DocumentAuditRecord;
import com.tracevault.repository.DocumentAuditRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAuditService {

    private final DocumentAuditRecordRepository auditRecordRepository;
    private static final String GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    /**
     * Appends a tamper-evident audit record into the cryptographic hash chain.
     */
    @Transactional
    public DocumentAuditRecord recordAudit(
            String documentId,
            String documentName,
            Integer versionNumber,
            String actorId,
            String actorName,
            String action,
            String outcome,
            String details,
            String ipAddress
    ) {
        List<DocumentAuditRecord> existingRecords = auditRecordRepository.findByDocumentIdOrderByTimestampAsc(documentId);
        String previousHash = existingRecords.isEmpty()
                ? GENESIS_PREV_HASH
                : existingRecords.get(existingRecords.size() - 1).getRecordHash();

        String id = "aud_rec_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);
        LocalDateTime now = LocalDateTime.now();

        // Calculate cryptographic hash chain block
        String rawPayload = previousHash + ":" + id + ":" + documentId + ":" + actorId + ":" + action + ":" + outcome + ":" + now + ":" + details;
        String recordHash = computeSha256(rawPayload);

        DocumentAuditRecord record = DocumentAuditRecord.builder()
                .id(id)
                .documentId(documentId)
                .documentName(documentName)
                .versionNumber(versionNumber != null ? versionNumber : 1)
                .actorId(actorId)
                .actorName(actorName)
                .action(action)
                .outcome("SUCCESS".equalsIgnoreCase(outcome) ? DocumentAuditRecord.AuditOutcome.SUCCESS : DocumentAuditRecord.AuditOutcome.FAILURE)
                .details(details)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .previousHash(previousHash)
                .recordHash(recordHash)
                .timestamp(now)
                .build();

        return auditRecordRepository.save(record);
    }

    /**
     * Verifies the cryptographic integrity of the document audit hash chain.
     * Checks that each block references its exact predecessor hash and that its content hash matches.
     */
    @Transactional(readOnly = true)
    public ChainVerificationResult verifyChain(String documentId) {
        List<DocumentAuditRecord> records = auditRecordRepository.findByDocumentIdOrderByTimestampAsc(documentId);
        if (records.isEmpty()) {
            return new ChainVerificationResult(true, 0, null, "No audit records present for this document.", LocalDateTime.now());
        }

        for (int i = 0; i < records.size(); i++) {
            DocumentAuditRecord current = records.get(i);
            String expectedPrevHash = (i == 0) ? GENESIS_PREV_HASH : records.get(i - 1).getRecordHash();

            // 1. Verify link to predecessor
            if (!expectedPrevHash.equalsIgnoreCase(current.getPreviousHash())) {
                return new ChainVerificationResult(
                        false,
                        records.size(),
                        current.getId(),
                        "Chain link broken at record #" + (i + 1) + " (" + current.getAction() + "). Predecessor hash mismatch.",
                        LocalDateTime.now()
                );
            }

            // 2. Verify payload hash integrity
            String rawPayload = current.getPreviousHash() + ":" + current.getId() + ":" + current.getDocumentId() + ":" +
                    current.getActorId() + ":" + current.getAction() + ":" + current.getOutcome().name() + ":" +
                    current.getTimestamp() + ":" + current.getDetails();
            String computedHash = computeSha256(rawPayload);

            if (!computedHash.equalsIgnoreCase(current.getRecordHash())) {
                return new ChainVerificationResult(
                        false,
                        records.size(),
                        current.getId(),
                        "Record payload integrity altered at record #" + (i + 1) + " (" + current.getAction() + "). Computed hash does not match stored block hash.",
                        LocalDateTime.now()
                );
            }
        }

        return new ChainVerificationResult(true, records.size(), null, "Cryptographic audit hash chain fully verified.", LocalDateTime.now());
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 computation failed", e);
        }
    }

    public record ChainVerificationResult(
            boolean isValid,
            int chainLength,
            String brokenRecordId,
            String message,
            LocalDateTime verifiedAt
    ) {}
}
