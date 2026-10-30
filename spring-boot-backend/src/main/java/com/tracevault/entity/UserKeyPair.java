package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_key_pairs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserKeyPair {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64, unique = true)
    private String userId;

    @Lob
    @Column(name = "public_key_pem", nullable = false, columnDefinition = "TEXT")
    private String publicKeyPem;

    @Column(name = "public_key_fingerprint", nullable = false, length = 128)
    private String publicKeyFingerprint;

    @Lob
    @Column(name = "encrypted_private_key", nullable = false, columnDefinition = "TEXT")
    private String encryptedPrivateKey;

    @Column(name = "algorithm", nullable = false, length = 32)
    @Builder.Default
    private String algorithm = "RSA-2048";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
