# TraceVault — Smart Document Management and Integrity Monitoring System

**Tagline:** *Your documents. Your control.*  
**Project Title:** TraceVault — A Personalized Smart Document Management and Integrity Monitoring System  
**Academic Target:** Final-Year Engineering Capstone & Enterprise Demonstration

---

## 1. Executive Summary & Core Purpose

TraceVault is a specialized document management and integrity monitoring platform engineered to protect sensitive documents against unauthorized tampering, silent bit rot, and storage corruption.

### The Three Critical Pillars
1. **Sensitive Document Change Detection:** Computes a SHA-256 cryptographic baseline on the secure backend at registration. Runs scheduled continuous background verifications and manual integrity sweeps.
2. **Automatic Security Alerts:** Instantly generates categorized security alerts (`INTEGRITY_MISMATCH`, `STORAGE_FAILURE`) with detailed previous vs. current cryptographic signatures, severity levels, deduplication against spam, and recommended actions.
3. **Fault Tolerance and Reliable Recovery:** Handles database timeouts, storage read errors, and interrupted uploads gracefully. Utilizes atomic file writes, bounded exponential backoff retries, and authorized baseline governance.

---

## 2. Technology Stack

- **Backend Framework:** Java 17, Spring Boot 3.2.3
- **Security & Auth:** Spring Security 6 (BCrypt Password Hashing, Stateless API Protection)
- **Persistence & ORM:** Spring Data JPA / Hibernate, MySQL 8.0+
- **Database Driver:** `mysql-connector-j`
- **Integrity Engine:** Standard Java `java.security.MessageDigest` (NIST SHA-256)
- **Task Scheduling:** Spring `@EnableScheduling` with concurrency locks
- **Testing:** JUnit 5, Spring Boot Test, Mockito (15 verification scenarios)
- **Frontend / Live Interface:** Responsive SPA with Bootstrap 5 design aesthetics, Plus Jakarta Sans typography, and Digilocker-inspired minimal palette.

---

## 3. Database Architecture (MySQL)

### Schema Overview (`src/main/resources/schema.sql`)
1. `users` — Stores hashed user credentials (BCrypt, 12 rounds), roles, and active state.
2. `documents` — Stores document metadata, original filename, sanitized storage identifier, file size, MIME type, SHA-256 reference baseline, monitoring toggle, category, and verification state.
3. `integrity_verifications` — Immutable historical ledger of every scheduled and manual check, execution type, calculated hash, and detailed status (`MATCH`, `MISMATCH`, `STORAGE_ERROR`).
4. `integrity_incidents` — Tracks active detected incidents from discovery until authorized resolution or baseline approval.
5. `security_alerts` — Persistent alerts with read/unread flags, deduplication tracking, severity (`CRITICAL`, `WARNING`, `INFO`), and recommended remediation.
6. `audit_logs` — Comprehensive audit trail of all authentication events, uploads, downloads, deletions, and baseline updates.
7. `checklist_items` — Personalized readiness checklists for college admission, corporate onboarding, and scholarship grants.

---

## 4. How to Configure & Run the Spring Boot Backend

### Prerequisites
- Java Development Kit (JDK 17 or higher)
- Apache Maven 3.8+
- MySQL Server 8.0+

### Step 1: Initialize MySQL Database
```bash
# Connect to your MySQL server
mysql -u root -p

# Execute initialization script
source src/main/resources/schema.sql;
source src/main/resources/data.sql;
```

### Step 2: Configure `application.properties`
Open `src/main/resources/application.properties` and verify your credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tracevault_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YourSecurePasswordHere
tracevault.storage.directory=/var/tracevault/documents
tracevault.scheduler.verification-interval-ms=60000
```

### Step 3: Compile and Run
```bash
# Package the application
mvn clean package -DskipTests

# Run the Spring Boot application
java -jar target/tracevault-backend-1.0.0.jar
```
The application will launch on `http://localhost:8080`.

---

## 5. Running the 15 Test Scenarios

Execute the comprehensive test suite validating all 15 core scenarios:
```bash
mvn test
```

### Scenarios Covered in `TraceVaultApplicationTests.java`:
1. **Scenario 1:** Successful user registration and BCrypt password hashing.
2. **Scenario 2:** Rejecting invalid logins with incorrect passwords.
3. **Scenario 3:** Uploading a valid document and computing a 64-char SHA-256 baseline.
4. **Scenario 4:** Rejecting unsupported or empty files safely.
5. **Scenario 5:** Verifying an untouched file confirms cryptographic integrity (`MATCH`).
6. **Scenario 6:** Detecting byte modifications in storage and flagging `MISMATCH`.
7. **Scenario 7:** Dispatching an automatic `CRITICAL` Security Alert.
8. **Scenario 8:** Deduplicating alerts to prevent spamming for the same incident.
9. **Scenario 9:** Enforcing multi-tenant isolation (User A cannot access User B's documents).
10. **Scenario 10:** Safe handling of missing storage files (`STORAGE_ERROR`, never false success).
11. **Scenario 11:** Handling temporary database timeouts with bounded retries.
12. **Scenario 12:** Atomically removing partial temp uploads on interruption.
13. **Scenario 13:** Resuming healthy verification after transient failures.
14. **Scenario 14:** Recording human-authorized baseline updates in the audit ledger.
15. **Scenario 15:** Enforcing that verification failure never reports a false positive.

---

## 6. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Registers a new user with BCrypt password hashing |
| `/api/auth/login` | `POST` | Authenticates user credentials |
| `/api/documents` | `GET` | Lists all documents belonging to the authenticated user |
| `/api/documents/upload` | `POST` | Multipart upload, creates SHA-256 baseline, saves to storage |
| `/api/documents/{id}/verify`| `POST` | Manually triggers cryptographic SHA-256 verification |
| `/api/documents/{id}/download`| `GET` | Streams file binary if user owns the document |
| `/api/documents/{id}` | `DELETE` | Securely removes document and cleans up disk files |
| `/api/alerts` | `GET` | Fetches security alerts with severity filtering |
| `/api/alerts/{id}/read` | `POST` | Marks an alert as read |
| `/api/alerts/{id}/resolve`| `POST` | Resolves an alert |
| `/api/system/health` | `GET` | System health check and subsystem status |
