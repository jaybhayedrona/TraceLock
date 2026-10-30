-- TraceVault Seed Data

INSERT IGNORE INTO `document_categories` (`id`, `category_name`, `description`) VALUES
('cat_1', 'Educational', 'Academic mark sheets, degrees, transcripts, passing certificates'),
('cat_2', 'Identity', 'Passports, National ID cards, driving licenses, voter identity records'),
('cat_3', 'Financial', 'Tax receipts, investment statements, salary acknowledgments, bank letters'),
('cat_4', 'Employment', 'Offer letters, relieving certificates, NDA contracts, work agreements'),
('cat_5', 'Legal', 'Agreements, affidavit deeds, powers of attorney, registered contracts'),
('cat_6', 'Other', 'General miscellaneous verified documents');

-- Default Demo Users
INSERT IGNORE INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `avatar_url`, `family_id`, `family_role`, `membership_status`) VALUES
('usr_demo_001', 'Alexander Vance', 'alexander.vance@tracevault.io', '$2a$10$wKxN0s3l9P1/t6hJ6iJ3u.8RzL8WqG5J8b7Wd3eF4z1aBcDeFgHiK', 'ROLE_USER', '/api/users/usr_demo_001/avatar', 'fam_tracevault_001', 'Owner', 'ACTIVE'),
('usr_priya_002', 'Priya Sharma-Vance', 'priya.vance@family.org', '$2a$10$wKxN0s3l9P1/t6hJ6iJ3u.8RzL8WqG5J8b7Wd3eF4z1aBcDeFgHiK', 'ROLE_USER', '/api/users/usr_priya_002/avatar', 'fam_tracevault_001', 'Editor', 'ACTIVE'),
('usr_rohan_003', 'Rohan Vance', 'rohan.vance@tracevault.io', '$2a$10$wKxN0s3l9P1/t6hJ6iJ3u.8RzL8WqG5J8b7Wd3eF4z1aBcDeFgHiK', 'ROLE_USER', '/api/users/usr_rohan_003/avatar', 'fam_tracevault_001', 'Viewer', 'ACTIVE'),
('usr_admin_001', 'TraceVault Security Lead', 'admin@tracevault.io', '$2a$10$wKxN0s3l9P1/t6hJ6iJ3u.8RzL8WqG5J8b7Wd3eF4z1aBcDeFgHiK', 'ROLE_ADMIN', NULL, NULL, NULL, 'ACTIVE');

-- Default Family
INSERT IGNORE INTO `families` (`id`, `name`, `owner_id`, `retention_days`, `created_at`) VALUES
('fam_tracevault_001', 'Vance Family Vault', 'usr_demo_001', 30, '2025-01-15 10:00:00');

-- Family Memberships
INSERT IGNORE INTO `family_members` (`id`, `family_id`, `user_id`, `family_role`, `membership_status`, `joined_at`) VALUES
('fm_001', 'fam_tracevault_001', 'usr_demo_001', 'Owner', 'ACTIVE', '2025-01-15 10:00:00'),
('fm_002', 'fam_tracevault_001', 'usr_priya_002', 'Editor', 'ACTIVE', '2025-01-16 14:30:00'),
('fm_003', 'fam_tracevault_001', 'usr_rohan_003', 'Viewer', 'ACTIVE', '2025-01-20 09:15:00');

-- Pending Invitation
INSERT IGNORE INTO `family_invitations` (`id`, `family_id`, `invited_email`, `role`, `invited_by`, `invited_by_name`, `status`, `invited_at`) VALUES
('finv_001', 'fam_tracevault_001', 'ananya.vance@university.edu', 'Viewer', 'usr_demo_001', 'Alexander Vance', 'PENDING', '2025-02-01 11:00:00');

-- Initial Activity Timeline
INSERT IGNORE INTO `family_activities` (`id`, `family_id`, `actor_id`, `actor_name`, `actor_avatar_url`, `action`, `document_id`, `document_name`, `details`, `timestamp`) VALUES
('fact_001', 'fam_tracevault_001', 'usr_demo_001', 'Alexander Vance', '/api/users/usr_demo_001/avatar', 'DOCUMENT_UPLOADED', 'doc_1791637624822_1', 'Passport_Government_Identity.pdf', 'Uploaded official identification document to Family Vault with SHA-256 baseline.', '2025-01-15 10:15:00'),
('fact_002', 'fam_tracevault_001', 'usr_demo_001', 'Alexander Vance', '/api/users/usr_demo_001/avatar', 'MEMBER_INVITED', NULL, NULL, 'Invited Priya Sharma-Vance as Editor to Vance Family Vault.', '2025-01-16 14:00:00'),
('fact_003', 'fam_tracevault_001', 'usr_priya_002', 'Priya Sharma-Vance', '/api/users/usr_priya_002/avatar', 'DOCUMENT_VIEWED', 'doc_1791637624822_1', 'Passport_Government_Identity.pdf', 'Viewed document content and verified digital signature.', '2025-01-16 15:45:00');

