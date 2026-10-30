package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "owner_id", nullable = false, length = 64)
    private String ownerId;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "storage_filename", nullable = false, unique = true, length = 255)
    private String storageFilename;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "sha256_baseline", nullable = false, length = 64)
    private String sha256Baseline;

    @Enumerated(EnumType.STRING)
    @Column(name = "monitoring_status", nullable = false, length = 20)
    @Builder.Default
    private MonitoringStatus monitoringStatus = MonitoringStatus.MONITORED;

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String category = "Other";

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.VERIFIED;

    @Column(name = "version_number", nullable = false)
    @Builder.Default
    private Integer versionNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_status", nullable = false, length = 20)
    @Builder.Default
    private SignatureStatus signatureStatus = SignatureStatus.UNSIGNED;

    @Column(name = "last_verification_time")
    private LocalDateTime lastVerificationTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum MonitoringStatus {
        MONITORED,
        PAUSED
    }

    public enum VerificationStatus {
        VERIFIED,
        MISMATCH_DETECTED,
        PENDING,
        FAILED,
        DISABLED
    }

    public enum SignatureStatus {
        UNSIGNED,
        SIGNED,
        INVALID
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
