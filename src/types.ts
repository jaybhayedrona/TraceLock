export type FamilyRole = 'Owner' | 'Editor' | 'Viewer';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  familyId?: string;
  familyRole?: FamilyRole;
  membershipStatus?: MembershipStatus;
  familyJoinedAt?: string;
  createdAt?: string;
}

export type DocumentCategory =
  | 'Educational'
  | 'Identity'
  | 'Financial'
  | 'Employment'
  | 'Legal'
  | 'Other';

export type VerificationStatus =
  | 'VERIFIED'
  | 'MISMATCH_DETECTED'
  | 'PENDING'
  | 'FAILED'
  | 'DISABLED';

export type SignatureStatus = 'UNSIGNED' | 'SIGNED' | 'INVALID';

export type DocumentPermissionLevel = 'VIEWER' | 'EDITOR' | 'OWNER';

export interface DocumentMemberPermission {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  permission: DocumentPermissionLevel;
  grantedBy: string;
  grantedAt: string;
}

export interface DocumentItem {
  id: string;
  ownerId: string;
  originalFilename: string;
  storageFilename: string;
  mimeType: string;
  fileSize: number;
  sha256Baseline: string;
  monitoringStatus: 'MONITORED' | 'PAUSED';
  category: DocumentCategory;
  expiryDate?: string;
  reminderDaysBefore?: number[];
  remindedStages?: string[];
  createdAt: string;
  lastVerificationTime?: string;
  verificationStatus: VerificationStatus;
  lastCalculatedHash?: string;
  versionNumber?: number;
  signatureStatus?: SignatureStatus;
  activeSignatureId?: string;
  // Family Vault enhancement fields
  isFamilyVault?: boolean;
  familyId?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  retentionExpiresAt?: string;
  permissions?: DocumentMemberPermission[];
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  versionNumber: number;
  documentHash: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureValue: string;
  algorithm: string;
  publicKeyPem: string;
  publicKeyFingerprint: string;
  signedAt: string;
  status: 'VALID' | 'REVOKED';
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFilename: string;
  storageFilename: string;
  fileSize: number;
  sha256Hash: string;
  createdAt: string;
  createdBy: string;
  changeSummary: string;
  isSigned: boolean;
}

export type DocumentAuditAction =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_SIGNED'
  | 'SIGNATURE_VERIFIED'
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'DOCUMENT_VERSION_CREATED'
  | 'DOCUMENT_MODIFIED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_RESTORED'
  | 'DOCUMENT_PERMANENTLY_DELETED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_UNSHARED'
  | 'DOCUMENT_SHARE_REVOKED';

export interface DocumentAuditRecord {
  id: string;
  documentId: string;
  documentName: string;
  versionNumber: number;
  actorId: string;
  actorName: string;
  action: DocumentAuditAction;
  outcome: 'SUCCESS' | 'FAILURE';
  details: string;
  timestamp: string;
  ipAddress: string;
  previousHash: string;
  recordHash: string;
}

export interface UserSigningKey {
  userId: string;
  publicKeyPem: string;
  publicKeyFingerprint: string;
  algorithm: string;
  createdAt: string;
}

export interface VerificationLog {
  id: string;
  documentId: string;
  documentName: string;
  userId: string;
  calculatedHash: string;
  baselineHash: string;
  status: 'MATCH' | 'MISMATCH' | 'STORAGE_ERROR' | 'SYSTEM_ERROR';
  executionType: 'MANUAL' | 'SCHEDULED';
  checkedAt: string;
  message: string;
}

export interface IntegrityIncident {
  id: string;
  documentId: string;
  documentName: string;
  userId: string;
  detectedHash: string;
  expectedHash: string;
  status: 'UNRESOLVED' | 'RESOLVED' | 'BASELINE_APPROVED';
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface SecurityAlert {
  id: string;
  documentId: string;
  documentName: string;
  userId: string;
  category:
    | 'INTEGRITY_MISMATCH'
    | 'STORAGE_FAILURE'
    | 'VERIFICATION_ERROR'
    | 'EXPIRY_WARNING'
    | 'UNAUTHORIZED_LOGIN_ATTEMPT'
    | 'ACCOUNT_LOCKED';
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  isRead: boolean;
  isResolved: boolean;
  previousHash?: string;
  currentHash?: string;
  createdAt: string;
  recommendedAction: string;
  ipAddress?: string;
  targetEmail?: string;
  failedAttempts?: number;
}

export type LoginStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED_LOCKED';

export interface LoginActivityLog {
  id: string;
  timestamp: string;
  email: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent: string;
  status: LoginStatus;
  failureReason?: string;
  alertTriggered: boolean;
  lockoutActive?: boolean;
}

export interface EmailNotificationRecord {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  type: 'UNAUTHORIZED_LOGIN' | 'ACCOUNT_LOCKED' | 'SECURITY_ALERT';
  sentAt: string;
  status: 'SENT' | 'SIMULATED';
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    attemptsCount?: number;
    timestamp?: string;
  };
}

export interface UnauthorizedLoginAlertData {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  attemptsCount: number;
  detectedAt: string;
  isLocked: boolean;
  lockoutRemainingSeconds?: number;
  alertMessage: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  linkedDocId?: string;
}

export interface SystemHealth {
  status: 'UP' | 'DEGRADED';
  subsystems: {
    storage: {
      status: string;
      path: string;
      documentsStored: number;
    };
    database: {
      status: string;
      engine: string;
      recordsCount: {
        users: number;
        documents: number;
        verifications: number;
        alerts: number;
        incidents: number;
      };
    };
    scheduler: {
      status: string;
      intervalSeconds: number;
      lastRun: string;
    };
    security: {
      authModule: string;
      hashingAlgorithm: string;
    };
  };
  simulations: {
    databaseTimeout: boolean;
    storageUnavailable: boolean;
  };
}

export interface FaultEvent {
  id: string;
  userId: string;
  operation: string;
  resourceName: string;
  errorDetails: string;
  timestamp: string;
  status: 'FAILED' | 'RECOVERED';
  retryable: boolean;
}

export interface SharedDocument {
  id: string;
  documentId: string;
  documentName: string;
  ownerId: string;
  sharedWithEmail: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt: string;
  createdAt: string;
  accessCount: number;
}

// ============================================================================
// FAMILY VAULT ENHANCEMENT MODELS
// ============================================================================

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  familyRole: FamilyRole;
  membershipStatus: MembershipStatus;
  joinedAt: string;
  isSelf: boolean;
  canManage: boolean;
}

export interface FamilyOverview {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  documentCount: number;
  pendingInvitesCount: number;
  recentActivityCount: number;
  upcomingRemindersCount: number;
  deletedDocumentsCount: number;
  retentionDays: number;
  createdAt: string;
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  invitedEmail: string;
  role: 'Editor' | 'Viewer';
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
}

export type FamilyActivityAction =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_MODIFIED'
  | 'DOCUMENT_RENAMED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_RESTORED'
  | 'DOCUMENT_PERMANENTLY_DELETED'
  | 'DOCUMENT_SIGNED'
  | 'SIGNATURE_VERIFIED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'PERMISSION_UPDATED'
  | 'EXPIRY_REMINDER_SET';

export interface FamilyActivityItem {
  id: string;
  familyId: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  actorAvatarUrl?: string;
  action: FamilyActivityAction;
  documentId?: string;
  documentName?: string;
  details: string;
  timestamp: string;
}

export interface RecycleBinDocument {
  id: string;
  originalFilename: string;
  category: DocumentCategory;
  mimeType: string;
  fileSize: number;
  sha256Baseline: string;
  deletedAt: string;
  deletedBy: string;
  deletedByName: string;
  deletedByAvatarUrl?: string;
  retentionExpiresAt: string;
  daysRemaining: number;
  canRestore: boolean;
  canPermanentDelete: boolean;
}

export interface DocumentReminderInfo {
  documentId: string;
  documentName: string;
  category: DocumentCategory;
  expiryDate: string;
  reminderDaysBefore: number[];
  daysRemaining: number;
  isOverdue: boolean;
  status: 'OVERDUE' | 'EXPIRING_SOON' | 'ACTIVE';
}

export interface DuplicateDocumentInfo {
  id: string;
  originalFilename: string;
  createdAt: string;
  fileSize: number;
  category?: DocumentCategory;
  sha256Baseline: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  message?: string;
  existingDocument?: DuplicateDocumentInfo;
}



