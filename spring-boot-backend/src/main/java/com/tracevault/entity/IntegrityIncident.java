package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integrity_incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrityIncident {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "document_id", nullable = false, length = 64)
    private String documentId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "detected_hash", nullable = false, length = 64)
    private String detectedHash;

    @Column(name = "expected_hash", nullable = false, length = 64)
    private String expectedHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.UNRESOLVED;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by", length = 150)
    private String resolvedBy;

    @Column(name = "investigation_notes", columnDefinition = "TEXT")
    private String investigationNotes;

    public enum IncidentStatus {
        UNRESOLVED,
        RESOLVED,
        BASELINE_APPROVED
    }

    @PrePersist
    protected void onCreate() {
        if (detectedAt == null) detectedAt = LocalDateTime.now();
    }
}
