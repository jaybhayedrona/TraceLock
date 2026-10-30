package com.tracevault.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Callable;

/**
 * Fault Tolerance and Recovery Subsystem:
 * - Exponential backoff with bounded retries for transient IO/DB hiccups
 * - Clean cleanup of temporary or interrupted uploads
 * - Safe atomic file operations
 */
@Slf4j
@Service
public class FaultToleranceService {

    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_BACKOFF_MS = 100;

    /**
     * Executes an operation with bounded retry and exponential backoff.
     */
    public <T> T executeWithRetry(Callable<T> operation, String operationName) throws Exception {
        int attempt = 0;
        long backoff = INITIAL_BACKOFF_MS;

        while (true) {
            attempt++;
            try {
                return operation.call();
            } catch (Exception ex) {
                if (attempt >= MAX_RETRIES) {
                    log.error("[FaultTolerance] Operation '{}' permanently failed after {} attempts.", operationName, attempt, ex);
                    throw ex;
                }
                log.warn("[FaultTolerance] Transient failure in '{}' (attempt {}/{}). Retrying in {}ms: {}",
                        operationName, attempt, MAX_RETRIES, backoff, ex.getMessage());
                try {
                    Thread.sleep(backoff);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ex;
                }
                backoff *= 2;
            }
        }
    }

    /**
     * Cleans up temporary artifacts after an interrupted or failed upload.
     */
    public void cleanupTempFile(Path tempPath) {
        if (tempPath != null && Files.exists(tempPath)) {
            try {
                Files.delete(tempPath);
                log.info("[FaultTolerance] Safely removed incomplete temp upload file: {}", tempPath);
            } catch (IOException e) {
                log.warn("[FaultTolerance] Could not remove temp file: {}", tempPath, e);
            }
        }
    }
}
