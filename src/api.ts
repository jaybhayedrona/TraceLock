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
import { isStaticHosting, ClientStore } from './clientStore';

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
  if (isStaticHosting()) {
    return ClientStore.getCurrentUser();
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return ClientStore.getCurrentUser();
    }
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('fetchCurrentUser failed, checking client store', err);
    return ClientStore.getCurrentUser();
  }
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  if (isStaticHosting()) {
    return ClientStore.login(email);
  }
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return ClientStore.login(email);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    localStorage.setItem('tracevault_token', data.token);
    return data;
  } catch (err: any) {
    if (err.message?.includes('JSON') || err.name === 'TypeError') {
      return ClientStore.login(email);
    }
    throw err;
  }
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ token: string; user: User }> {
  if (isStaticHosting()) {
    return ClientStore.register(name, email);
  }
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return ClientStore.register(name, email);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    localStorage.setItem('tracevault_token', data.token);
    return data;
  } catch (err: any) {
    if (err.message?.includes('JSON') || err.name === 'TypeError') {
      return ClientStore.register(name, email);
    }
    throw err;
  }
}

export async function logoutApi(): Promise<void> {
  ClientStore.logout();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  } catch (_) {}
  localStorage.removeItem('tracevault_token');
}

export async function getDocuments(): Promise<DocumentItem[]> {
  if (isStaticHosting()) {
    return ClientStore.getDocuments();
  }
  try {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return ClientStore.getDocuments();
    }
    const data = await res.json();
    return data.documents;
  } catch (err) {
    return ClientStore.getDocuments();
  }
}

export async function uploadDocument(formData: FormData): Promise<DocumentItem> {
  const file = formData.get('file') as File;
  const category = (formData.get('category') as string) || 'General';
  const description = (formData.get('description') as string) || '';

  if (isStaticHosting()) {
    return await ClientStore.addDocument(file, category, description);
  }
  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return await ClientStore.addDocument(file, category, description);
    }
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
  } catch (err: any) {
    if (err.isDuplicate) throw err;
    if (err.message?.includes('JSON') || err.name === 'TypeError') {
      return await ClientStore.addDocument(file, category, description);
    }
    throw err;
  }
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
  if (isStaticHosting()) {
    return await ClientStore.checkDuplicate(file);
  }
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/check-duplicate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return await ClientStore.checkDuplicate(file);
    }
    const data = await res.json();
    if (!res.ok) {
      return await ClientStore.checkDuplicate(file);
    }
    return data;
  } catch (err) {
    return await ClientStore.checkDuplicate(file);
  }
}

export async function verifyDocument(id: string): Promise<any> {
  if (isStaticHosting()) {
    return ClientStore.verifyDocument(id);
  }
  try {
    const res = await fetch(`${API_BASE}/documents/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return ClientStore.verifyDocument(id);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Verification failed');
    }
    return data;
  } catch (err: any) {
    if (err.message?.includes('JSON') || err.name === 'TypeError') {
      return ClientStore.verifyDocument(id);
    }
    throw err;
  }
}

export async function verifyAllDocuments(): Promise<any> {
  if (isStaticHosting()) {
    return ClientStore.verifyAllDocuments();
  }
  try {
    const res = await fetch(`${API_BASE}/documents/verify-all`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return ClientStore.verifyAllDocuments();
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Bulk verification failed');
    }
    return data;
  } catch (err: any) {
    if (err.message?.includes('JSON') || err.name === 'TypeError') {
      return ClientStore.verifyAllDocuments();
    }
    throw err;
  }
}

export async function toggleMonitoring(id: string): Promise<DocumentItem> {
  if (isStaticHosting()) {
    return ClientStore.toggleMonitoring(id);
  }
  try {
    const res = await fetch(`${API_BASE}/documents/${id}/toggle-monitoring`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return ClientStore.toggleMonitoring(id);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to toggle monitoring');
    }
    return data.document;
  } catch (err) {
    return ClientStore.toggleMonitoring(id);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (isStaticHosting()) {
    ClientStore.deleteDocument(id);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      ClientStore.deleteDocument(id);
    }
  } catch (err) {
    ClientStore.deleteDocument(id);
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
  if (isStaticHosting()) {
    return ClientStore.getAlerts();
  }
  try {
    const res = await fetch(`${API_BASE}/alerts`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getAlerts();
    const data = await res.json();
    return data.alerts;
  } catch (err) {
    return ClientStore.getAlerts();
  }
}

export async function markAlertRead(id: string): Promise<void> {
  ClientStore.markAlertRead(id);
  try {
    await fetch(`${API_BASE}/alerts/${id}/read`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  } catch (_) {}
}

export async function resolveAlert(id: string): Promise<void> {
  ClientStore.resolveAlert(id);
  try {
    await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  } catch (_) {}
}

export async function getIncidents(): Promise<IntegrityIncident[]> {
  if (isStaticHosting()) {
    return ClientStore.getIncidents();
  }
  try {
    const res = await fetch(`${API_BASE}/integrity/incidents`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getIncidents();
    const data = await res.json();
    return data.incidents;
  } catch (err) {
    return ClientStore.getIncidents();
  }
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
  if (isStaticHosting()) {
    return ClientStore.getVerificationHistory();
  }
  try {
    const res = await fetch(`${API_BASE}/integrity/history`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getVerificationHistory();
    const data = await res.json();
    return data.history;
  } catch (err) {
    return ClientStore.getVerificationHistory();
  }
}

export async function getChecklists(): Promise<ChecklistItem[]> {
  if (isStaticHosting()) {
    return ClientStore.getChecklists();
  }
  try {
    const res = await fetch(`${API_BASE}/checklists`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getChecklists();
    const data = await res.json();
    return data.items;
  } catch (err) {
    return ClientStore.getChecklists();
  }
}

export async function toggleChecklistItem(id: string): Promise<void> {
  ClientStore.toggleChecklist(id);
  try {
    await fetch(`${API_BASE}/checklists/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  } catch (_) {}
}

export async function linkChecklistDoc(id: string, documentId: string): Promise<void> {
  await fetch(`${API_BASE}/checklists/${id}/link-doc`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isStaticHosting()) {
    return ClientStore.getAuditLogs();
  }
  try {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getAuditLogs();
    const data = await res.json();
    return data.logs;
  } catch (err) {
    return ClientStore.getAuditLogs();
  }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  if (isStaticHosting()) {
    return ClientStore.getSystemHealth();
  }
  try {
    const res = await fetch(`${API_BASE}/system/health`);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getSystemHealth();
    return await res.json();
  } catch (err) {
    return ClientStore.getSystemHealth();
  }
}

export async function triggerScheduledJob(): Promise<any> {
  if (isStaticHosting()) {
    return ClientStore.verifyAllDocuments();
  }
  try {
    const res = await fetch(`${API_BASE}/system/trigger-scheduler`, { method: 'POST' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.verifyAllDocuments();
    return await res.json();
  } catch (err) {
    return ClientStore.verifyAllDocuments();
  }
}

// Test lab operations
export async function testLabTamper(documentId: string): Promise<any> {
  if (isStaticHosting()) {
    return ClientStore.tamperDocument(documentId);
  }
  try {
    const res = await fetch(`${API_BASE}/system/test-lab/tamper`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return ClientStore.tamperDocument(documentId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Tamper simulation failed');
    return data;
  } catch (err: any) {
    return ClientStore.tamperDocument(documentId);
  }
}

export async function testLabRestore(documentId: string): Promise<any> {
  if (isStaticHosting()) {
    return ClientStore.restoreDocument(documentId);
  }
  try {
    const res = await fetch(`${API_BASE}/system/test-lab/restore`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return ClientStore.restoreDocument(documentId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Restore failed');
    return data;
  } catch (err: any) {
    return ClientStore.restoreDocument(documentId);
  }
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
  if (isStaticHosting()) {
    return ClientStore.getLoginActivityLogs();
  }
  try {
    const res = await fetch(`${API_BASE}/security/login-activity`, {
      headers: getAuthHeader(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return ClientStore.getLoginActivityLogs();
    const data = await res.json();
    return data;
  } catch (err) {
    return ClientStore.getLoginActivityLogs();
  }
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
  if (isStaticHosting()) {
    return ClientStore.simulateAttack(targetEmail);
  }
  try {
    const res = await fetch(`${API_BASE}/security/simulate-unauthorized-attack`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetEmail }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return ClientStore.simulateAttack(targetEmail);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to simulate attack');
    return data;
  } catch (err: any) {
    return ClientStore.simulateAttack(targetEmail);
  }
}


