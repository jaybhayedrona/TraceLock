package com.tracevault.service;

import com.tracevault.entity.AuditLog;
import com.tracevault.entity.Document;
import com.tracevault.entity.IntegrityIncident;
import com.tracevault.entity.SecurityAlert;
import com.tracevault.repository.AlertRepository;
import com.tracevault.repository.AuditLogRepository;
import com.tracevault.repository.IntegrityIncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final IntegrityIncidentRepository incidentRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Handles detected hash mismatch:
     * - Records or updates IntegrityIncident
     * - Creates SecurityAlert if no duplicate unresolved alert exists
     * - Writes immutable AuditLog
     */
    @Transactional
    public void handleIntegrityMismatch(Document doc, String detectedHash) {
        // 1. Prevent duplicate unresolved incidents
        Optional<IntegrityIncident> existingIncident = incidentRepository
                .findFirstByDocumentIdAndStatus(doc.getId(), IntegrityIncident.IncidentStatus.UNRESOLVED);

        if (existingIncident.isEmpty()) {
            IntegrityIncident incident = IntegrityIncident.builder()
                    .id("inc_" + UUID.randomUUID().toString().replace("-", ""))
                    .documentId(doc.getId())
                    .userId(doc.getOwnerId())
                    .detectedHash(detectedHash)
                    .expectedHash(doc.getSha256Baseline())
                    .status(IntegrityIncident.IncidentStatus.UNRESOLVED)
                    .detectedAt(LocalDateTime.now())
                    .investigationNotes("Cryptographic divergence detected by verification engine.")
                    .build();
            incidentRepository.save(incident);

            // Audit Log
            AuditLog audit = AuditLog.builder()
                    .id("aud_" + UUID.randomUUID().toString().replace("-", ""))
                    .userId(doc.getOwnerId())
                    .userName("Integrity Engine")
                    .action("INTEGRITY_MISMATCH_RECORDED")
                    .resourceType("DOCUMENT")
                    .resourceId(doc.getId())
                    .details(String.format("Hash deviation flagged for %s", doc.getOriginalFilename()))
                    .ipAddress("127.0.0.1")
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        }

        // 2. Prevent duplicate alerts for the same unresolved incident
        Optional<SecurityAlert> existingAlert = alertRepository
                .findFirstByDocumentIdAndCategoryAndIsResolvedFalse(doc.getId(), "INTEGRITY_MISMATCH");

        if (existingAlert.isEmpty()) {
            SecurityAlert alert = SecurityAlert.builder()
                    .id("alt_" + UUID.randomUUID().toString().replace("-", ""))
                    .documentId(doc.getId())
                    .userId(doc.getOwnerId())
                    .category("INTEGRITY_MISMATCH")
                    .title(String.format("Integrity warning: Unexpected change in '%s'", doc.getOriginalFilename()))
                    .message(String.format("A change was detected in your monitored document. Stored bytes do not match the registered baseline."))
                    .severity(SecurityAlert.AlertSeverity.CRITICAL)
                    .isRead(false)
                    .isResolved(false)
                    .previousHash(doc.getSha256Baseline())
                    .currentHash(detectedHash)
                    .recommendedAction("Investigate this document immediately. If the update was legitimate, authorize a new baseline. Otherwise, restore from backup.")
                    .createdAt(LocalDateTime.now())
                    .build();
            alertRepository.save(alert);
            log.warn("Created Security Alert for doc {}", doc.getId());
        }
    }

    /**
     * Handles storage read errors: creates storage alert if not already present.
     */
    @Transactional
    public void handleStorageError(Document doc) {
        Optional<SecurityAlert> existingAlert = alertRepository
                .findFirstByDocumentIdAndCategoryAndIsResolvedFalse(doc.getId(), "STORAGE_FAILURE");

        if (existingAlert.isEmpty()) {
            SecurityAlert alert = SecurityAlert.builder()
                    .id("alt_" + UUID.randomUUID().toString().replace("-", ""))
                    .documentId(doc.getId())
                    .userId(doc.getOwnerId())
                    .category("STORAGE_FAILURE")
                    .title(String.format("Storage Fault: '%s' unreadable", doc.getOriginalFilename()))
                    .message("TraceVault could not read the document file from trusted storage during verification.")
                    .severity(SecurityAlert.AlertSeverity.CRITICAL)
                    .isRead(false)
                    .isResolved(false)
                    .recommendedAction("Check storage disk connectivity, file permissions, or restore file from trusted archive.")
                    .createdAt(LocalDateTime.now())
                    .build();
            alertRepository.save(alert);
        }
    }
}
