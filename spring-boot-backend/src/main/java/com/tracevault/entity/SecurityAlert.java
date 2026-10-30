package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAlert {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "document_id", nullable = false, length = 64)
    private String documentId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AlertSeverity severity = AlertSeverity.CRITICAL;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "is_resolved", nullable = false)
    @Builder.Default
    private Boolean isResolved = false;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "current_hash", length = 64)
    private String currentHash;

    @Column(name = "recommended_action", nullable = false, columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum AlertSeverity {
        CRITICAL,
        WARNING,
        INFO
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
