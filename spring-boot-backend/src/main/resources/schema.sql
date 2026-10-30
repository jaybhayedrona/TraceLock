-- ============================================================================
-- TRACEVAULT — MYSQL DATABASE INITIALIZATION SCHEMA
-- Project: TraceVault — Personalized Smart Document Management & Integrity Monitoring
-- Author: Senior Engineering Team
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tracevault_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tracevault_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL DEFAULT 'ROLE_USER',
    `avatar_url` VARCHAR(500) NULL,
    `family_id` VARCHAR(64) NULL,
    `family_role` ENUM('Owner', 'Editor', 'Viewer') NULL DEFAULT 'Owner',
    `membership_status` ENUM('ACTIVE', 'INVITED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_family` (`family_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DOCUMENT CATEGORIES
CREATE TABLE IF NOT EXISTS `document_categories` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS `documents` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `owner_id` VARCHAR(64) NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `storage_filename` VARCHAR(255) NOT NULL UNIQUE,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `sha256_baseline` VARCHAR(64) NOT NULL,
    `monitoring_status` ENUM('MONITORED', 'PAUSED') NOT NULL DEFAULT 'MONITORED',
    `category` VARCHAR(64) NOT NULL DEFAULT 'Other',
    `expiry_date` DATE NULL,
    `is_family_vault` BOOLEAN NOT NULL DEFAULT FALSE,
    `family_id` VARCHAR(64) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `deleted_at` TIMESTAMP NULL,
    `deleted_by` VARCHAR(64) NULL,
    `deleted_by_name` VARCHAR(150) NULL,
    `retention_expires_at` TIMESTAMP NULL,
    `reminder_days_before` VARCHAR(100) NULL DEFAULT '30,14,7',
    `verification_status` ENUM('VERIFIED', 'MISMATCH_DETECTED', 'PENDING', 'FAILED', 'DISABLED') NOT NULL DEFAULT 'VERIFIED',
    `version_number` INT NOT NULL DEFAULT 1,
    `signature_status` ENUM('UNSIGNED', 'SIGNED', 'INVALID') NOT NULL DEFAULT 'UNSIGNED',
    `last_verification_time` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_docs_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_docs_owner` (`owner_id`),
    INDEX `idx_docs_family` (`family_id`),
    INDEX `idx_docs_deleted` (`is_deleted`),
    INDEX `idx_docs_monitoring` (`monitoring_status`),
    INDEX `idx_docs_status` (`verification_status`),
    INDEX `idx_docs_hash` (`sha256_baseline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INTEGRITY VERIFICATIONS (History of every manual & scheduled check)
CREATE TABLE IF NOT EXISTS `integrity_verifications` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `calculated_hash` VARCHAR(64) NOT NULL,
    `baseline_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('MATCH', 'MISMATCH', 'STORAGE_ERROR', 'SYSTEM_ERROR') NOT NULL,
    `execution_type` ENUM('MANUAL', 'SCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `message` TEXT NOT NULL,
    `checked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_verif_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_verif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_verif_doc` (`document_id`),
    INDEX `idx_verif_status` (`status`),
    INDEX `idx_verif_time` (`checked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. INTEGRITY INCIDENTS (Tracks detected tamper incidents until authorized resolution)
CREATE TABLE IF NOT EXISTS `integrity_incidents` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `detected_hash` VARCHAR(64) NOT NULL,
    `expected_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('UNRESOLVED', 'RESOLVED', 'BASELINE_APPROVED') NOT NULL DEFAULT 'UNRESOLVED',
    `detected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` TIMESTAMP NULL,
    `resolved_by` VARCHAR(150) NULL,
    `investigation_notes` TEXT NULL,
    CONSTRAINT `fk_inc_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_inc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_inc_status` (`status`),
    INDEX `idx_inc_doc` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SECURITY ALERTS
CREATE TABLE IF NOT EXISTS `security_alerts` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `severity` ENUM('CRITICAL', 'WARNING', 'INFO') NOT NULL DEFAULT 'CRITICAL',
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_resolved` BOOLEAN NOT NULL DEFAULT FALSE,
    `previous_hash` VARCHAR(64) NULL,
    `current_hash` VARCHAR(64) NULL,
    `recommended_action` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` TIMESTAMP NULL,
    CONSTRAINT `fk_alert_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_alert_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_alert_user_read` (`user_id`, `is_read`),
    INDEX `idx_alert_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AUDIT LOGS (Immutable security tracking)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `user_name` VARCHAR(150) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(64) NOT NULL,
    `resource_id` VARCHAR(64) NOT NULL,
    `details` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS `checklist_items` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `checklist_id` VARCHAR(64) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `linked_doc_id` VARCHAR(64) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_chk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. USER KEY PAIRS (RSA-2048 signing keys, private key AES-encrypted)
CREATE TABLE IF NOT EXISTS `user_key_pairs` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `public_key_pem` TEXT NOT NULL,
    `public_key_fingerprint` VARCHAR(128) NOT NULL,
    `encrypted_private_key` TEXT NOT NULL,
    `algorithm` VARCHAR(32) NOT NULL DEFAULT 'RSA-2048',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_keys_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_keys_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. DOCUMENT VERSIONS (Preserves history and previous signed documents)
CREATE TABLE IF NOT EXISTS `document_versions` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `version_number` INT NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `storage_filename` VARCHAR(255) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `sha256_hash` VARCHAR(64) NOT NULL,
    `change_summary` TEXT NULL,
    `is_signed` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_by` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ver_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    INDEX `idx_ver_doc` (`document_id`),
    INDEX `idx_ver_num` (`document_id`, `version_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. DOCUMENT SIGNATURES (RSA-2048 with SHA-256 digital signatures)
CREATE TABLE IF NOT EXISTS `document_signatures` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `version_number` INT NOT NULL,
    `document_hash` VARCHAR(64) NOT NULL,
    `signer_id` VARCHAR(64) NOT NULL,
    `signer_name` VARCHAR(150) NOT NULL,
    `signer_email` VARCHAR(255) NOT NULL,
    `signature_value` TEXT NOT NULL,
    `algorithm` VARCHAR(64) NOT NULL DEFAULT 'SHA256withRSA',
    `public_key_pem` TEXT NOT NULL,
    `public_key_fingerprint` VARCHAR(128) NOT NULL,
    `signed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('VALID', 'REVOKED') NOT NULL DEFAULT 'VALID',
    CONSTRAINT `fk_sig_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sig_user` FOREIGN KEY (`signer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_sig_doc` (`document_id`),
    INDEX `idx_sig_signer` (`signer_id`),
    INDEX `idx_sig_version` (`document_id`, `version_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. DOCUMENT AUDIT RECORDS (Tamper-evident hash chained lifecycle trail)
CREATE TABLE IF NOT EXISTS `document_audit_records` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `document_name` VARCHAR(255) NOT NULL,
    `version_number` INT NOT NULL DEFAULT 1,
    `actor_id` VARCHAR(64) NOT NULL,
    `actor_name` VARCHAR(150) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `outcome` ENUM('SUCCESS', 'FAILURE') NOT NULL DEFAULT 'SUCCESS',
    `details` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `previous_hash` VARCHAR(64) NOT NULL,
    `record_hash` VARCHAR(64) NOT NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_daud_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    INDEX `idx_daud_doc` (`document_id`),
    INDEX `idx_daud_actor` (`actor_id`),
    INDEX `idx_daud_chain` (`document_id`, `record_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. FAMILIES TABLE
CREATE TABLE IF NOT EXISTS `families` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `retention_days` INT NOT NULL DEFAULT 30,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_families_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_families_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. FAMILY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS `family_members` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `family_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `family_role` ENUM('Owner', 'Editor', 'Viewer') NOT NULL DEFAULT 'Viewer',
    `membership_status` ENUM('ACTIVE', 'INVITED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_fmembers_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fmembers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_family_user` (`family_id`, `user_id`),
    INDEX `idx_fmembers_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. FAMILY INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS `family_invitations` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `family_id` VARCHAR(64) NOT NULL,
    `invited_email` VARCHAR(255) NOT NULL,
    `role` ENUM('Editor', 'Viewer') NOT NULL DEFAULT 'Viewer',
    `invited_by` VARCHAR(64) NOT NULL,
    `invited_by_name` VARCHAR(150) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `invited_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_finv_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
    INDEX `idx_finv_email` (`invited_email`),
    INDEX `idx_finv_family` (`family_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. FAMILY ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS `family_activities` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `family_id` VARCHAR(64) NOT NULL,
    `actor_id` VARCHAR(64) NOT NULL,
    `actor_name` VARCHAR(150) NOT NULL,
    `actor_avatar_url` VARCHAR(500) NULL,
    `action` VARCHAR(64) NOT NULL,
    `document_id` VARCHAR(64) NULL,
    `document_name` VARCHAR(255) NULL,
    `details` TEXT NOT NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_factivity_family` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
    INDEX `idx_factivity_family` (`family_id`),
    INDEX `idx_factivity_actor` (`actor_id`),
    INDEX `idx_factivity_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. DOCUMENT PERMISSIONS TABLE (Per-document sharing permissions)
CREATE TABLE IF NOT EXISTS `document_permissions` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `permission` ENUM('VIEWER', 'EDITOR', 'OWNER') NOT NULL DEFAULT 'VIEWER',
    `granted_by` VARCHAR(64) NOT NULL,
    `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_dperm_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dperm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_doc_user_perm` (`document_id`, `user_id`),
    INDEX `idx_dperm_doc` (`document_id`),
    INDEX `idx_dperm_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. DOCUMENT REMINDERS TABLE (Document expiry notification tracking)
CREATE TABLE IF NOT EXISTS `document_reminders` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `expiry_date` DATE NOT NULL,
    `reminder_days_before` VARCHAR(100) NOT NULL DEFAULT '30,14,7',
    `status` ENUM('ACTIVE', 'EXPIRED', 'DISMISSED') NOT NULL DEFAULT 'ACTIVE',
    `last_reminded_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_drem_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
    INDEX `idx_drem_doc` (`document_id`),
    INDEX `idx_drem_user` (`user_id`),
    INDEX `idx_drem_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


