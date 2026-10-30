package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integrity_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrityVerification {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "document_id", nullable = false, length = 64)
    private String documentId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "calculated_hash", nullable = false, length = 64)
    private String calculatedHash;

    @Column(name = "baseline_hash", nullable = false, length = 64)
    private String baselineHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationResult status;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_type", nullable = false, length = 20)
    @Builder.Default
    private ExecutionType executionType = ExecutionType.SCHEDULED;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    public enum VerificationResult {
        MATCH,
        MISMATCH,
        STORAGE_ERROR,
        SYSTEM_ERROR
    }

    public enum ExecutionType {
        MANUAL,
        SCHEDULED
    }

    @PrePersist
    protected void onCreate() {
        if (checkedAt == null) checkedAt = LocalDateTime.now();
    }
}
