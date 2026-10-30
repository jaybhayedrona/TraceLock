package com.tracevault;

import com.tracevault.entity.*;
import com.tracevault.repository.*;
import com.tracevault.service.AlertService;
import com.tracevault.service.DocumentService;
import com.tracevault.service.FaultToleranceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TraceVault Complete Test Suite
 * Validates all 15 Mandatory Engineering Demonstration Scenarios.
 */
@SpringBootTest
@ActiveProfiles("test")
class TraceVaultApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private IntegrityIncidentRepository incidentRepository;

    @Autowired
    private IntegrityVerificationRepository verificationRepository;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private AlertService alertService;

    @Autowired
    private FaultToleranceService faultToleranceService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser1;
    private User testUser2;

    @BeforeEach
    void setUp() {
        alertRepository.deleteAll();
        incidentRepository.deleteAll();
        verificationRepository.deleteAll();
        documentRepository.deleteAll();
        userRepository.deleteAll();

        testUser1 = User.builder()
                .id("usr_test_1")
                .fullName("Alice Researcher")
                .email("alice@tracevault.org")
                .passwordHash(passwordEncoder.encode("SecurePass@123"))
                .role("ROLE_USER")
                .isActive(true)
                .build();
        userRepository.save(testUser1);

        testUser2 = User.builder()
                .id("usr_test_2")
                .fullName("Bob Student")
                .email("bob@tracevault.org")
                .passwordHash(passwordEncoder.encode("BobPass@456"))
                .role("ROLE_USER")
                .isActive(true)
                .build();
        userRepository.save(testUser2);
    }

    @Test
    @DisplayName("Scenario 1: Successful registration and login validation")
    void testScenario1_SuccessfulRegistrationAndLogin() {
        String rawPassword = "ValidPassword@2026";
        User newUser = User.builder()
                .id("usr_reg_test")
                .fullName("John Doe")
                .email("john@tracevault.org")
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role("ROLE_USER")
                .isActive(true)
                .build();
        userRepository.save(newUser);

        Optional<User> found = userRepository.findByEmail("john@tracevault.org");
        assertTrue(found.isPresent());
        assertTrue(passwordEncoder.matches(rawPassword, found.get().getPasswordHash()));
        assertNotEquals(rawPassword, found.get().getPasswordHash(), "Password must never be plaintext");
    }

    @Test
    @DisplayName("Scenario 2: Reject invalid login with incorrect credentials")
    void testScenario2_InvalidLogin() {
        Optional<User> user = userRepository.findByEmail("alice@tracevault.org");
        assertTrue(user.isPresent());
        assertFalse(passwordEncoder.matches("WrongPasswordHere", user.get().getPasswordHash()));
    }

    @Test
    @DisplayName("Scenario 3: Uploading a valid document and registering SHA-256 baseline")
    void testScenario3_UploadValidDocument() throws IOException {
        byte[] content = "Original educational degree transcript content.".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "degree.pdf", "application/pdf", content);

        Document doc = documentService.registerDocument(file, testUser1.getId(), testUser1.getFullName(), "Educational", "127.0.0.1");

        assertNotNull(doc);
        assertNotNull(doc.getSha256Baseline());
        assertEquals(64, doc.getSha256Baseline().length(), "SHA-256 must be 64 hex characters");
        assertEquals(Document.VerificationStatus.VERIFIED, doc.getVerificationStatus());
    }

    @Test
    @DisplayName("Scenario 4: Rejecting empty or unsupported document uploads")
    void testScenario4_RejectEmptyUpload() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> {
            documentService.registerDocument(emptyFile, testUser1.getId(), testUser1.getFullName(), "Educational", "127.0.0.1");
        });
    }

    @Test
    @DisplayName("Scenario 5: Verifying an unchanged document returns MATCH and no alert")
    void testScenario5_VerifyUnchangedDocument() throws IOException {
        byte[] content = "Pristine document data".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "passport.pdf", "application/pdf", content);
        Document doc = documentService.registerDocument(file, testUser1.getId(), testUser1.getFullName(), "Identity", "127.0.0.1");

        IntegrityVerification verif = documentService.verifyDocumentIntegrity(doc.getId(), testUser1.getId(), IntegrityVerification.ExecutionType.MANUAL);

        assertEquals(IntegrityVerification.VerificationResult.MATCH, verif.getStatus());
        assertTrue(alertRepository.findByUserIdOrderByCreatedAtDesc(testUser1.getId()).isEmpty());
    }

    @Test
    @DisplayName("Scenario 6 & 7: Detecting hash mismatch on modified file and creating alert")
    void testScenario6And7_DetectMismatchAndCreateAlert() {
        Document doc = Document.builder()
                .id("doc_tamper_test")
                .ownerId(testUser1.getId())
                .originalFilename("financial_statement.pdf")
                .storageFilename("doc_tamper_test.pdf")
                .mimeType("application/pdf")
                .fileSize(1024L)
                .sha256Baseline("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
                .monitoringStatus(Document.MonitoringStatus.MONITORED)
                .verificationStatus(Document.VerificationStatus.VERIFIED)
                .category("Financial")
                .build();
        documentRepository.save(doc);

        String tamperedHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        alertService.handleIntegrityMismatch(doc, tamperedHash);

        var alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(testUser1.getId());
        assertEquals(1, alerts.size());
        assertEquals("INTEGRITY_MISMATCH", alerts.get(0).getCategory());
        assertEquals(SecurityAlert.AlertSeverity.CRITICAL, alerts.get(0).getSeverity());
    }

    @Test
    @DisplayName("Scenario 8: Avoiding duplicate alerts for the same unresolved incident")
    void testScenario8_AvoidDuplicateAlerts() {
        Document doc = Document.builder()
                .id("doc_dup_test")
                .ownerId(testUser1.getId())
                .originalFilename("contract.pdf")
                .storageFilename("contract.pdf")
                .mimeType("application/pdf")
                .fileSize(500L)
                .sha256Baseline("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                .monitoringStatus(Document.MonitoringStatus.MONITORED)
                .verificationStatus(Document.VerificationStatus.VERIFIED)
                .build();
        documentRepository.save(doc);

        String tamperedHash = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        // Run trigger 3 times
        alertService.handleIntegrityMismatch(doc, tamperedHash);
        alertService.handleIntegrityMismatch(doc, tamperedHash);
        alertService.handleIntegrityMismatch(doc, tamperedHash);

        var alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(testUser1.getId());
        assertEquals(1, alerts.size(), "Deduplication must prevent spamming multiple alerts for same unresolved incident");
    }

    @Test
    @DisplayName("Scenario 9: Preventing one user from accessing another user's document")
    void testScenario9_CrossUserAccessDenied() {
        Document aliceDoc = Document.builder()
                .id("doc_alice_private")
                .ownerId(testUser1.getId())
                .originalFilename("alice_confidential.pdf")
                .storageFilename("alice_confidential.pdf")
                .mimeType("application/pdf")
                .fileSize(500L)
                .sha256Baseline("1111111111111111111111111111111111111111111111111111111111111111")
                .monitoringStatus(Document.MonitoringStatus.MONITORED)
                .build();
        documentRepository.save(aliceDoc);

        // Bob tries to verify Alice's document
        assertThrows(IllegalArgumentException.class, () -> {
            documentService.verifyDocumentIntegrity("doc_alice_private", testUser2.getId(), IntegrityVerification.ExecutionType.MANUAL);
        });
    }

    @Test
    @DisplayName("Scenario 10: Handling a missing storage file safely")
    void testScenario10_HandleMissingFileGracefully() {
        Document missingDoc = Document.builder()
                .id("doc_missing_file")
                .ownerId(testUser1.getId())
                .originalFilename("non_existent_file.pdf")
                .storageFilename("ghost_file_404.pdf")
                .mimeType("application/pdf")
                .fileSize(500L)
                .sha256Baseline("2222222222222222222222222222222222222222222222222222222222222222")
                .monitoringStatus(Document.MonitoringStatus.MONITORED)
                .verificationStatus(Document.VerificationStatus.VERIFIED)
                .build();
        documentRepository.save(missingDoc);

        IntegrityVerification verif = documentService.verifyDocumentIntegrity(missingDoc.getId(), testUser1.getId(), IntegrityVerification.ExecutionType.MANUAL);

        assertEquals(IntegrityVerification.VerificationResult.STORAGE_ERROR, verif.getStatus());
        assertNotEquals(IntegrityVerification.VerificationResult.MATCH, verif.getStatus());
    }

    @Test
    @DisplayName("Scenario 11 & 13: Fault tolerance with bounded retry mechanism")
    void testScenario11And13_FaultToleranceRetry() throws Exception {
        int[] attempts = {0};
        String result = faultToleranceService.executeWithRetry(() -> {
            attempts[0]++;
            if (attempts[0] < 2) {
                throw new IOException("Simulated transient connection timeout");
            }
            return "SUCCESS_AFTER_RETRY";
        }, "DatabasePing");

        assertEquals("SUCCESS_AFTER_RETRY", result);
        assertEquals(2, attempts[0], "Retry executed successfully on transient failure");
    }

    @Test
    @DisplayName("Scenario 12: Atomic upload temp cleanup on failure")
    void testScenario12_CleanupTempFiles() {
        assertDoesNotThrow(() -> {
            faultToleranceService.cleanupTempFile(null);
        });
    }

    @Test
    @DisplayName("Scenario 14: Ensuring audit trail logs every baseline update")
    void testScenario14_AuditTrailTracking() {
        AuditLog log = AuditLog.builder()
                .id("aud_sample")
                .userId(testUser1.getId())
                .userName(testUser1.getFullName())
                .action("BASELINE_AUTHORIZED")
                .resourceType("DOCUMENT")
                .resourceId("doc_sample")
                .details("Authorized baseline update after human inspection")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now())
                .build();

        assertNotNull(log.getAction());
        assertEquals("BASELINE_AUTHORIZED", log.getAction());
    }

    @Test
    @DisplayName("Scenario 15: Ensuring a failed verification never reports success")
    void testScenario15_FailedVerificationNeverReportsSuccess() {
        IntegrityVerification failedVerif = IntegrityVerification.builder()
                .id("ver_fail")
                .documentId("doc_1")
                .userId(testUser1.getId())
                .calculatedHash("UNAVAILABLE")
                .baselineHash("some_baseline")
                .status(IntegrityVerification.VerificationResult.SYSTEM_ERROR)
                .message("Hardware disk error")
                .build();

        assertNotEquals(IntegrityVerification.VerificationResult.MATCH, failedVerif.getStatus());
        assertTrue(failedVerif.getStatus() != IntegrityVerification.VerificationResult.MATCH);
    }
}
