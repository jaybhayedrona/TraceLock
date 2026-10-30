package com.tracevault.service;

import com.tracevault.entity.Document;
import com.tracevault.entity.IntegrityVerification;
import com.tracevault.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Continuous Integrity Monitoring Scheduler.
 * Features:
 * - Configurable interval (fixedDelayString = "${tracevault.scheduler.verification-interval-ms:60000}")
 * - Concurrency lock: Prevents overlapping verification cycles if batch takes longer
 * - Processes active documents in bounded batches
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IntegrityMonitoringScheduler {

    private final DocumentRepository documentRepository;
    private final DocumentService documentService;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    @Scheduled(fixedDelayString = "${tracevault.scheduler.verification-interval-ms:60000}")
    public void runScheduledIntegrityVerification() {
        if (!isRunning.compareAndSet(false, true)) {
            log.info("[Scheduler] Previous verification batch is still executing. Skipping this cycle.");
            return;
        }

        try {
            log.info("[Scheduler] Starting automatic document integrity verification cycle...");
            List<Document> dueDocuments = documentRepository.findDocumentsDueForScheduledVerification();

            int verifiedCount = 0;
            int mismatchCount = 0;

            for (Document doc : dueDocuments) {
                try {
                    IntegrityVerification result = documentService.verifyDocumentIntegrity(
                            doc.getId(),
                            doc.getOwnerId(),
                            IntegrityVerification.ExecutionType.SCHEDULED
                    );

                    if (result.getStatus() == IntegrityVerification.VerificationResult.MATCH) {
                        verifiedCount++;
                    } else if (result.getStatus() == IntegrityVerification.VerificationResult.MISMATCH) {
                        mismatchCount++;
                    }
                } catch (Exception docEx) {
                    log.error("[Scheduler] Error verifying document {}: {}", doc.getId(), docEx.getMessage());
                }
            }

            log.info("[Scheduler] Verification cycle completed. Checked: {}, Verified: {}, Mismatches: {}",
                    dueDocuments.size(), verifiedCount, mismatchCount);
        } finally {
            isRunning.set(false);
        }
    }
}
