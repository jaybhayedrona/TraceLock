import {
  DocumentItem,
  SecurityAlert,
  VerificationLog,
  IntegrityIncident,
  AuditLog,
  ChecklistItem,
  SystemHealth,
  User,
  FaultEvent,
  SharedDocument,
  DocumentSignature,
  DocumentVersion,
  DocumentAuditRecord,
  UserSigningKey,
  FamilyMember,
  FamilyOverview,
  FamilyInvitation,
  FamilyActivityItem,
  RecycleBinDocument,
  DocumentReminderInfo,
  DocumentPermissionLevel,
  LoginActivityLog,
  EmailNotificationRecord,
  UnauthorizedLoginAlertData,
} from './types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('tracevault_token');
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('tracevault_token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('fetchCurrentUser failed', err);
    return null;
  }
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  localStorage.setItem('tracevault_token', data.token);
  return data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, confirmPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  localStorage.setItem('tracevault_token', data.token);
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  } catch (_) {}
  localStorage.removeItem('tracevault_token');
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch documents');
  }
  const data = await res.json();
  return data.documents;
}

export async function uploadDocument(formData: FormData): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409 && data.isDuplicate) {
      const err: any = new Error(
        data.error || 'Duplicate Document Detected! This file already exists in your vault. Do you want to upload it anyway?'
      );
      err.isDuplicate = true;
      err.existingDocument = data.existingDocument;
      throw err;
    }
    throw new Error(data.error || 'Upload failed');
  }
  return data.document;
}

export async function checkDuplicateDocument(file: File): Promise<{
  isDuplicate: boolean;
  existingDocument?: {
    id: string;
    originalFilename: string;
    createdAt: string;
    fileSize: number;
    category?: string;
    sha256Baseline: string;
  };
}> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/check-duplicate`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Duplicate check failed');
  }
  return data;
}

export async function verifyDocument(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/${id}/verify`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Verification failed');
  }
  return data;
}

export async function verifyAllDocuments(): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/verify-all`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Bulk verification failed');
  }
  return data;
}

export async function toggleMonitoring(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/documents/${id}/toggle-monitoring`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle monitoring');
  }
  return data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete document');
  }
}

export async function downloadDocument(id: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}/download`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Download failed');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export interface DocumentContentResponse {
  id: string;
  filename: string;
  category: string;
  mimeType: string;
  fileSize: number;
  sha256Baseline: string;
  lastCalculatedHash: string;
  verificationStatus: string;
  textContent: string;
  isPdf: boolean;
  isImage: boolean;
}

export async function getDocumentContent(id: string): Promise<DocumentContentResponse> {
  const res = await fetch(`${API_BASE}/documents/${id}/content`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to load document content');
  }
  return res.json();
}

export function getDocumentViewUrl(id: string): string {
  const token = localStorage.getItem('tracevault_token') || 'usr_demo_001';
  return `${API_BASE}/documents/${id}/view?token=${encodeURIComponent(token)}`;
}

export async function getAlerts(): Promise<SecurityAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.alerts;
}

export async function markAlertRead(id: string): Promise<void> {
  await fetch(`${API_BASE}/alerts/${id}/read`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
}

export async function resolveAlert(id: string): Promise<void> {
  await fetch(`${API_BASE}/alerts/${id}/resolve`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
}

export async function getIncidents(): Promise<IntegrityIncident[]> {
  const res = await fetch(`${API_BASE}/integrity/incidents`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.incidents;
}

export async function approveBaseline(incidentId: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/integrity/incidents/${incidentId}/approve-baseline`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to approve baseline');
  }
  return data;
}

export async function getVerificationHistory(): Promise<VerificationLog[]> {
  const res = await fetch(`${API_BASE}/integrity/history`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.history;
}

export async function getChecklists(): Promise<ChecklistItem[]> {
  const res = await fetch(`${API_BASE}/checklists`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items;
}

export async function toggleChecklistItem(id: string): Promise<void> {
  await fetch(`${API_BASE}/checklists/${id}/toggle`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
}

export async function linkChecklistDoc(id: string, documentId: string): Promise<void> {
  await fetch(`${API_BASE}/checklists/${id}/link-doc`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.logs;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/system/health`);
  return res.json();
}

export async function triggerScheduledJob(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/trigger-scheduler`, { method: 'POST' });
  return res.json();
}

// Test lab operations
export async function testLabTamper(documentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/system/test-lab/tamper`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Tamper simulation failed');
  return data;
}

export async function testLabRestore(documentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/system/test-lab/restore`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Restore failed');
  return data;
}

export async function testLabToggleStorage(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/test-lab/toggle-storage-fault`, {
    method: 'POST',
  });
  return res.json();
}

export async function testLabToggleDb(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/test-lab/toggle-db-fault`, {
    method: 'POST',
  });
  return res.json();
}

// Fault Tolerance Subsystem API
export async function getFaultEvents(): Promise<FaultEvent[]> {
  const res = await fetch(`${API_BASE}/fault-tolerance/events`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events || [];
}

export async function retryFaultEvent(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/fault-tolerance/events/${id}/retry`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Retry operation failed');
  return data;
}

// Shared Documents API
export async function getSharedDocuments(): Promise<SharedDocument[]> {
  const res = await fetch(`${API_BASE}/shared-documents`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.sharedDocuments || [];
}

export async function createSharedDocument(
  documentId: string,
  sharedWithEmail: string,
  permission: 'VIEW' | 'DOWNLOAD',
  expiresAt: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/shared-documents/create`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, sharedWithEmail, permission, expiresAt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create share link');
  return data;
}

export async function revokeSharedDocument(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/shared-documents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke share link');
  return data;
}

// Digital Signatures & Document Audit Trail APIs

export async function signDocument(documentId: string): Promise<{ signature: DocumentSignature; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/sign`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to digitally sign document');
  return data;
}

export async function verifyDocumentSignature(documentId: string): Promise<{
  status: 'VALID' | 'INVALID';
  isMatch: boolean;
  message: string;
  signature?: DocumentSignature;
  currentHash?: string;
  signedHash?: string;
  signerName?: string;
  signedAt?: string;
  algorithm?: string;
  publicKeyFingerprint?: string;
}> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/verify-signature`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok && !data.status) throw new Error(data.error || 'Signature verification request failed');
  return data;
}

export async function getDocumentSignatures(documentId: string): Promise<DocumentSignature[]> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/signatures`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.signatures || [];
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/versions`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.versions || [];
}

export async function createDocumentVersion(documentId: string, formData: FormData): Promise<{ version: DocumentVersion; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/versions`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload new document version');
  return data;
}

export async function getDocumentAuditTrail(documentId: string): Promise<DocumentAuditRecord[]> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/audit-trail`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.records || [];
}

export async function verifyDocumentAuditChain(documentId: string): Promise<{
  isValid: boolean;
  chainLength: number;
  brokenRecordId?: string;
  error?: string;
  verifiedAt: string;
}> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/audit-trail/verify-chain`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify audit hash chain');
  return data;
}

export async function getUserSigningKey(): Promise<UserSigningKey> {
  const res = await fetch(`${API_BASE}/user/signing-key`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to retrieve signing credential');
  return data;
}

// ============================================================================
// PROFILE & AVATAR APIS
// ============================================================================

export async function uploadProfilePicture(file: File): Promise<{ message: string; avatarUrl: string; user: User }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${API_BASE}/users/profile/avatar`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');
  return data;
}

export async function removeProfilePicture(): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_BASE}/users/profile/avatar`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove profile picture');
  return data;
}

export async function updateProfile(name: string): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

// ============================================================================
// FAMILY VAULT APIS
// ============================================================================

export async function getFamilyOverview(): Promise<FamilyOverview> {
  const res = await fetch(`${API_BASE}/family`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load Family Vault overview');
  }
  const data = await res.json();
  return data.overview;
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const res = await fetch(`${API_BASE}/family/members`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.members || [];
}

export async function inviteFamilyMember(
  email: string,
  role: 'Editor' | 'Viewer',
  name?: string
): Promise<{ message: string; invitation: FamilyInvitation }> {
  const res = await fetch(`${API_BASE}/family/members/invite`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to invite family member');
  return data;
}

export async function updateFamilyMemberRole(
  memberId: string,
  role: 'Owner' | 'Editor' | 'Viewer'
): Promise<{ message: string; member: FamilyMember }> {
  const res = await fetch(`${API_BASE}/family/members/${memberId}/role`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update member role');
  return data;
}

export async function removeFamilyMember(memberId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/members/${memberId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove family member');
  return data;
}

export async function getFamilyInvitations(): Promise<FamilyInvitation[]> {
  const res = await fetch(`${API_BASE}/family/invitations`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.invitations || [];
}

export async function revokeFamilyInvitation(invitationId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke invitation');
  return data;
}

export async function getFamilyActivityTimeline(actionFilter?: string): Promise<FamilyActivityItem[]> {
  const url = actionFilter && actionFilter !== 'ALL'
    ? `${API_BASE}/family/activity?action=${encodeURIComponent(actionFilter)}`
    : `${API_BASE}/family/activity`;
  const res = await fetch(url, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

export async function getFamilyDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/family/documents`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents || [];
}

export async function shareDocumentToFamily(
  documentId: string,
  memberPermissions: { userId: string; permission: DocumentPermissionLevel }[],
  expiryDate?: string,
  reminderDays?: number[]
): Promise<{ message: string; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/family/documents/share`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, permissions: memberPermissions, expiryDate, reminderDays }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to share document to Family Vault');
  return data;
}

export async function updateDocumentPermissions(
  documentId: string,
  permissions: { userId: string; permission: DocumentPermissionLevel }[]
): Promise<{ message: string; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}/permissions`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update document permissions');
  return data;
}

export async function revokeDocumentPermission(
  documentId: string,
  userId: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}/permissions/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke document permission');
  return data;
}

export async function setDocumentExpiryReminder(
  documentId: string,
  expiryDate: string,
  reminderDaysBefore: number[]
): Promise<{ message: string; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}/reminders`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiryDate, reminderDaysBefore }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set expiry reminder');
  return data;
}

export async function getFamilyReminders(): Promise<DocumentReminderInfo[]> {
  const res = await fetch(`${API_BASE}/family/reminders`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.reminders || [];
}

// Recycle Bin APIs
export async function deleteFamilyDocument(documentId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to move document to Recycle Bin');
  return data;
}

export async function getRecycleBinDocuments(): Promise<RecycleBinDocument[]> {
  const res = await fetch(`${API_BASE}/family/recycle-bin`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents || [];
}

export async function restoreRecycleBinDocument(documentId: string): Promise<{ message: string; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/family/recycle-bin/${documentId}/restore`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to restore document');
  return data;
}

export async function permanentlyDeleteDocument(documentId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/recycle-bin/${documentId}/permanent`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to permanently delete document');
  return data;
}

export async function emptyFamilyRecycleBin(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE}/family/recycle-bin`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to empty Recycle Bin');
  return data;
}

export async function unshareFamilyDocument(documentId: string): Promise<{ message: string; document: DocumentItem }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}/unshare`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove document from Family Vault');
  return data;
}

export async function deleteDocumentExpiryReminder(documentId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/family/documents/${documentId}/reminders`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete reminder');
  return data;
}

// ==========================================
// SECURITY & UNAUTHORIZED LOGIN DETECTION APIS
// ==========================================

export async function getLoginActivityLogs(): Promise<{
  logs: LoginActivityLog[];
  metrics: {
    total: number;
    success: number;
    failed: number;
    blocked: number;
    lockoutsActive: number;
  };
  lockedAccounts: { email: string; lockoutRemainingSeconds: number; attempts: number }[];
}> {
  const res = await fetch(`${API_BASE}/security/login-activity`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load login activity logs');
  return data;
}

export async function getUnauthorizedLoginAlerts(): Promise<{ alerts: UnauthorizedLoginAlertData[] }> {
  const res = await fetch(`${API_BASE}/security/unauthorized-alerts`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load unauthorized login alerts');
  return data;
}

export async function dismissUnauthorizedAlert(alertId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/security/unauthorized-alerts/${alertId}/dismiss`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to dismiss alert');
  return data;
}

export async function getEmailAlerts(): Promise<{ emails: EmailNotificationRecord[] }> {
  const res = await fetch(`${API_BASE}/security/email-alerts`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load email alerts');
  return data;
}

export async function unlockAccount(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/security/unlock-account`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to unlock account');
  return data;
}

export async function simulateUnauthorizedAttack(targetEmail?: string): Promise<{
  message: string;
  targetEmail: string;
  attemptsSimulated: number;
  alert: UnauthorizedLoginAlertData;
  emailDispatched: boolean;
}> {
  const res = await fetch(`${API_BASE}/security/simulate-unauthorized-attack`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetEmail }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to simulate attack');
  return data;
}


