package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_audit_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAuditRecord {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "document_id", nullable = false, length = 64)
    private String documentId;

    @Column(name = "document_name", nullable = false, length = 255)
    private String documentName;

    @Column(name = "version_number", nullable = false)
    @Builder.Default
    private Integer versionNumber = 1;

    @Column(name = "actor_id", nullable = false, length = 64)
    private String actorId;

    @Column(name = "actor_name", nullable = false, length = 150)
    private String actorName;

    @Column(name = "action", nullable = false, length = 64)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, length = 20)
    @Builder.Default
    private AuditOutcome outcome = AuditOutcome.SUCCESS;

    @Column(name = "details", nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "record_hash", nullable = false, length = 64)
    private String recordHash;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    public enum AuditOutcome {
        SUCCESS,
        FAILURE
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
