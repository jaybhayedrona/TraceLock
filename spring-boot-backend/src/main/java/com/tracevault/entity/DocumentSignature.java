package com.tracevault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_signatures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSignature {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "document_id", nullable = false, length = 64)
    private String documentId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "document_hash", nullable = false, length = 64)
    private String documentHash;

    @Column(name = "signer_id", nullable = false, length = 64)
    private String signerId;

    @Column(name = "signer_name", nullable = false, length = 150)
    private String signerName;

    @Column(name = "signer_email", nullable = false, length = 255)
    private String signerEmail;

    @Lob
    @Column(name = "signature_value", nullable = false, columnDefinition = "TEXT")
    private String signatureValue;

    @Column(name = "algorithm", nullable = false, length = 64)
    @Builder.Default
    private String algorithm = "SHA256withRSA";

    @Lob
    @Column(name = "public_key_pem", nullable = false, columnDefinition = "TEXT")
    private String publicKeyPem;

    @Column(name = "public_key_fingerprint", nullable = false, length = 128)
    private String publicKeyFingerprint;

    @Column(name = "signed_at", nullable = false)
    private LocalDateTime signedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SignatureStatus status = SignatureStatus.VALID;

    public enum SignatureStatus {
        VALID,
        REVOKED
    }

    @PrePersist
    protected void onCreate() {
        if (signedAt == null) signedAt = LocalDateTime.now();
    }
}
