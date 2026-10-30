package com.tracevault.service;

import com.tracevault.entity.Document;
import com.tracevault.entity.DocumentSignature;
import com.tracevault.entity.DocumentVersion;
import com.tracevault.entity.User;
import com.tracevault.entity.UserKeyPair;
import com.tracevault.repository.DocumentRepository;
import com.tracevault.repository.DocumentSignatureRepository;
import com.tracevault.repository.DocumentVersionRepository;
import com.tracevault.repository.UserKeyPairRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DigitalSignatureService {

    private final DocumentRepository documentRepository;
    private final DocumentSignatureRepository signatureRepository;
    private final DocumentVersionRepository versionRepository;
    private final UserKeyPairRepository userKeyPairRepository;
    private final DocumentAuditService auditService;

    private static final String SIGNATURE_ALGORITHM = "SHA256withRSA";
    private static final String KEY_ALGORITHM = "RSA";
    private static final int RSA_KEY_SIZE = 2048;
    private static final String MASTER_PASSPHRASE = "TraceVault-Cryptographic-Master-Key-2026";
    private static final byte[] MASTER_SALT = "vault-salt-9872".getBytes(StandardCharsets.UTF_8);

    /**
     * Signs a document using the authenticated signer's RSA-2048 private key.
     */
    @Transactional
    public DocumentSignature signDocument(Document doc, User signer, byte[] documentBytes) throws Exception {
        // Enforce document ownership or administrative authorization
        if (!doc.getOwnerId().equals(signer.getId()) && !"ROLE_ADMIN".equals(signer.getRole())) {
            throw new SecurityException("Unauthorized: Only the document owner can digitally sign this document.");
        }

        // Calculate SHA-256 of exact document bytes
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(documentBytes);
        String calculatedHash = bytesToHex(hashBytes);

        // Retrieve or generate signer's RSA-2048 key pair
        UserKeyPair keyPairRecord = getOrCreateUserKeyPair(signer);
        PrivateKey privateKey = decryptPrivateKey(keyPairRecord.getEncryptedPrivateKey());

        // Digitally sign exact document bytes using SHA256withRSA
        Signature rsaSignature = Signature.getInstance(SIGNATURE_ALGORITHM);
        rsaSignature.initSign(privateKey);
        rsaSignature.update(documentBytes);
        byte[] signatureBytes = rsaSignature.sign();
        String signatureValue = Base64.getEncoder().encodeToString(signatureBytes);

        int versionNum = doc.getVersionNumber() != null ? doc.getVersionNumber() : 1;
        String sigId = "sig_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);

        DocumentSignature signature = DocumentSignature.builder()
                .id(sigId)
                .documentId(doc.getId())
                .versionNumber(versionNum)
                .documentHash(calculatedHash)
                .signerId(signer.getId())
                .signerName(signer.getFullName())
                .signerEmail(signer.getEmail())
                .signatureValue(signatureValue)
                .algorithm(SIGNATURE_ALGORITHM)
                .publicKeyPem(keyPairRecord.getPublicKeyPem())
                .publicKeyFingerprint(keyPairRecord.getPublicKeyFingerprint())
                .signedAt(LocalDateTime.now())
                .status(DocumentSignature.SignatureStatus.VALID)
                .build();

        signatureRepository.save(signature);

        // Update document signature status
        doc.setSignatureStatus(Document.SignatureStatus.SIGNED);
        documentRepository.save(doc);

        // Update version record
        Optional<DocumentVersion> verOpt = versionRepository.findByDocumentIdAndVersionNumber(doc.getId(), versionNum);
        verOpt.ifPresent(v -> {
            v.setIsSigned(true);
            versionRepository.save(v);
        });

        // Record audit trail
        auditService.recordAudit(
                doc.getId(),
                doc.getOriginalFilename(),
                versionNum,
                signer.getId(),
                signer.getFullName(),
                "DOCUMENT_SIGNED",
                "SUCCESS",
                "Digitally signed version " + versionNum + " with RSA-2048 (" + SIGNATURE_ALGORITHM + "). Fingerprint: " + keyPairRecord.getPublicKeyFingerprint(),
                "127.0.0.1"
        );

        return signature;
    }

    /**
     * Verifies the digital signature of a document.
     */
    @Transactional
    public VerificationResult verifySignature(Document doc, User verifier, byte[] currentBytes) throws Exception {
        int versionNum = doc.getVersionNumber() != null ? doc.getVersionNumber() : 1;
        Optional<DocumentSignature> sigOpt = signatureRepository.findByDocumentIdAndVersionNumberAndStatus(
                doc.getId(), versionNum, DocumentSignature.SignatureStatus.VALID);

        if (sigOpt.isEmpty()) {
            auditService.recordAudit(
                    doc.getId(),
                    doc.getOriginalFilename(),
                    versionNum,
                    verifier.getId(),
                    verifier.getFullName(),
                    "SIGNATURE_VERIFICATION_FAILED",
                    "FAILURE",
                    "Verification attempted on unsigned document or revoked signature.",
                    "127.0.0.1"
            );
            return new VerificationResult(false, "Signature Invalid: Document has not been digitally signed.", null, null, null);
        }

        DocumentSignature signature = sigOpt.get();

        // Calculate current document hash
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(currentBytes);
        String currentHash = bytesToHex(hashBytes);

        // Verify RSA digital signature using signer's public key
        PublicKey publicKey = decodePublicKey(signature.getPublicKeyPem());
        Signature rsaVerify = Signature.getInstance(signature.getAlgorithm());
        rsaVerify.initVerify(publicKey);
        rsaVerify.update(currentBytes);
        byte[] sigBytes = Base64.getDecoder().decode(signature.getSignatureValue());
        boolean isSigValid = rsaVerify.verify(sigBytes);

        boolean isHashMatch = currentHash.equalsIgnoreCase(signature.getDocumentHash());
        boolean isValid = isSigValid && isHashMatch;

        if (isValid) {
            doc.setSignatureStatus(Document.SignatureStatus.SIGNED);
            documentRepository.save(doc);

            auditService.recordAudit(
                    doc.getId(),
                    doc.getOriginalFilename(),
                    versionNum,
                    verifier.getId(),
                    verifier.getFullName(),
                    "SIGNATURE_VERIFIED",
                    "SUCCESS",
                    "Digital signature verified for version " + versionNum + " by " + signature.getSignerName(),
                    "127.0.0.1"
            );

            return new VerificationResult(true, "Signature Verified: The document matches the signed version and the signature is valid.",
                    signature, currentHash, signature.getDocumentHash());
        } else {
            doc.setSignatureStatus(Document.SignatureStatus.INVALID);
            documentRepository.save(doc);

            auditService.recordAudit(
                    doc.getId(),
                    doc.getOriginalFilename(),
                    versionNum,
                    verifier.getId(),
                    verifier.getFullName(),
                    "SIGNATURE_VERIFICATION_FAILED",
                    "FAILURE",
                    "Digital signature verification failed! Document modified after signing. Expected: " + signature.getDocumentHash() + ", Computed: " + currentHash,
                    "127.0.0.1"
            );

            return new VerificationResult(false, "Signature Invalid: Verification failed or the document no longer matches the signed version.",
                    signature, currentHash, signature.getDocumentHash());
        }
    }

    /**
     * Retrieves or generates an RSA-2048 key pair for the user.
     */
    public UserKeyPair getOrCreateUserKeyPair(User user) throws Exception {
        Optional<UserKeyPair> existing = userKeyPairRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(KEY_ALGORITHM);
        keyGen.initialize(RSA_KEY_SIZE);
        KeyPair pair = keyGen.generateKeyPair();

        String pubPem = encodePublicKeyToPem(pair.getPublic());
        String fingerprint = computeKeyFingerprint(pair.getPublic());
        String privPem = encodePrivateKeyToPem(pair.getPrivate());
        String encryptedPriv = encryptPrivateKey(privPem);

        UserKeyPair record = UserKeyPair.builder()
                .id("key_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6))
                .userId(user.getId())
                .publicKeyPem(pubPem)
                .publicKeyFingerprint(fingerprint)
                .encryptedPrivateKey(encryptedPriv)
                .algorithm("RSA-2048")
                .createdAt(LocalDateTime.now())
                .build();

        return userKeyPairRepository.save(record);
    }

    // =========================================================================
    // Cryptographic Key Management Helpers
    // =========================================================================

    private SecretKey deriveAesKey() throws Exception {
        PBEKeySpec spec = new PBEKeySpec(MASTER_PASSPHRASE.toCharArray(), MASTER_SALT, 10000, 256);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }

    private String encryptPrivateKey(String pem) throws Exception {
        SecretKey key = deriveAesKey();
        byte[] iv = new byte[12];
        SecureRandom.getInstanceStrong().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
        byte[] cipherText = cipher.doFinal(pem.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(cipherText);
    }

    private PrivateKey decryptPrivateKey(String encryptedPayload) throws Exception {
        String[] parts = encryptedPayload.split(":");
        byte[] iv = Base64.getDecoder().decode(parts[0]);
        byte[] cipherText = Base64.getDecoder().decode(parts[1]);

        SecretKey key = deriveAesKey();
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
        byte[] plainBytes = cipher.doFinal(cipherText);

        String pem = new String(plainBytes, StandardCharsets.UTF_8);
        return decodePrivateKey(pem);
    }

    private String computeKeyFingerprint(PublicKey key) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(key.getEncoded());
        String hex = bytesToHex(hash);
        StringBuilder sb = new StringBuilder("SHA256:");
        for (int i = 0; i < Math.min(32, hex.length()); i += 2) {
            if (i > 0) sb.append(":");
            sb.append(hex.substring(i, i + 2));
        }
        return sb.toString();
    }

    private String encodePublicKeyToPem(PublicKey key) {
        String base64 = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(key.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----";
    }

    private String encodePrivateKeyToPem(PrivateKey key) {
        String base64 = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(key.getEncoded());
        return "-----BEGIN PRIVATE KEY-----\n" + base64 + "\n-----END PRIVATE KEY-----";
    }

    private PublicKey decodePublicKey(String pem) throws Exception {
        String clean = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] decoded = Base64.getDecoder().decode(clean);
        KeyFactory kf = KeyFactory.getInstance(KEY_ALGORITHM);
        return kf.generatePublic(new X509EncodedKeySpec(decoded));
    }

    private PrivateKey decodePrivateKey(String pem) throws Exception {
        String clean = pem.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] decoded = Base64.getDecoder().decode(clean);
        KeyFactory kf = KeyFactory.getInstance(KEY_ALGORITHM);
        return kf.generatePrivate(new PKCS8EncodedKeySpec(decoded));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    public record VerificationResult(
            boolean isMatch,
            String message,
            DocumentSignature signature,
            String currentHash,
            String signedHash
    ) {}
}
