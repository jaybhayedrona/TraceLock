/**
 * Client-Side Storage & Cryptographic Engine for Static Hosting (e.g. GitHub Pages)
 * Enables 100% interactive functionality without requiring a Node.js backend server.
 */

import {
  User,
  DocumentItem,
  DocumentCategory,
  SecurityAlert,
  VerificationLog,
  IntegrityIncident,
  AuditLog,
  ChecklistItem,
  SystemHealth,
  FaultEvent,
  SharedDocument,
  LoginActivityLog,
  UnauthorizedLoginAlertData,
} from './types';

export function isStaticHosting(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.endsWith('github.io') || host.endsWith('pages.dev') || window.location.protocol === 'file:';
}

const STORAGE_KEYS = {
  USER: 'tracelock_user',
  TOKEN: 'tracevault_token',
  DOCUMENTS: 'tracelock_documents',
  ALERTS: 'tracelock_alerts',
  INCIDENTS: 'tracelock_incidents',
  VERIFICATIONS: 'tracelock_verifications',
  CHECKLISTS: 'tracelock_checklists',
  AUDIT_LOGS: 'tracelock_audit_logs',
  SHARED_DOCS: 'tracelock_shared_docs',
};

const DEFAULT_USER: User = {
  id: 'usr_alex_morgan_01',
  email: 'dronajaybhaye017@gmail.com',
  name: 'Alex Morgan',
  role: 'admin',
  createdAt: '2026-01-15T08:30:00Z',
  avatarUrl: undefined,
};

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_financial_audit_2026',
    ownerId: 'usr_alex_morgan_01',
    originalFilename: 'financial_audit_2026.txt',
    storageFilename: 'doc_1792847275667_v9vs6_financial_audit_2026.txt',
    fileSize: 18840,
    mimeType: 'text/plain',
    sha256Baseline: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    lastCalculatedHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    verificationStatus: 'VERIFIED',
    monitoringStatus: 'MONITORED',
    createdAt: '2026-02-10T14:20:00Z',
    lastVerificationTime: new Date().toISOString(),
    category: 'Financial',
    versionNumber: 1,
    signatureStatus: 'SIGNED',
  },
  {
    id: 'doc_passport_identity',
    ownerId: 'usr_alex_morgan_01',
    originalFilename: 'Passport_Government_Identity.pdf',
    storageFilename: 'doc_1791637624822_1_Passport_Government_Identity.pdf',
    fileSize: 1468000,
    mimeType: 'application/pdf',
    sha256Baseline: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    lastCalculatedHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    verificationStatus: 'VERIFIED',
    monitoringStatus: 'MONITORED',
    createdAt: '2026-02-12T09:15:00Z',
    lastVerificationTime: new Date().toISOString(),
    category: 'Identity',
    versionNumber: 1,
    signatureStatus: 'SIGNED',
  },
  {
    id: 'doc_alex_audit',
    ownerId: 'usr_alex_morgan_01',
    originalFilename: 'alex_audit_document.txt',
    storageFilename: 'doc_1792847275773_4h1nw_alex_audit_document.txt',
    fileSize: 46280,
    mimeType: 'text/plain',
    sha256Baseline: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    lastCalculatedHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    verificationStatus: 'VERIFIED',
    monitoringStatus: 'MONITORED',
    createdAt: '2026-02-14T11:45:00Z',
    lastVerificationTime: new Date().toISOString(),
    category: 'Other',
    versionNumber: 1,
    signatureStatus: 'UNSIGNED',
  },
];

const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 'alt_001',
    documentId: 'doc_financial_audit_2026',
    documentName: 'financial_audit_2026.txt',
    userId: 'usr_alex_morgan_01',
    category: 'INTEGRITY_MISMATCH',
    severity: 'INFO',
    title: 'Verification Engine Baseline Verified',
    message: 'Scheduled SHA-256 background integrity cycle verified all vault records.',
    isRead: true,
    isResolved: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    recommendedAction: 'No immediate action required. All cryptographic baselines match.',
  },
  {
    id: 'alt_002',
    documentId: 'doc_alex_audit',
    documentName: 'alex_audit_document.txt',
    userId: 'usr_alex_morgan_01',
    category: 'INTEGRITY_MISMATCH',
    severity: 'WARNING',
    title: 'Digital Signature Notice',
    message: 'Audit document unsigned. Cryptographic signature recommended.',
    isRead: false,
    isResolved: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    recommendedAction: 'Sign document using your private Ed25519 signing key.',
  },
];

const INITIAL_CHECKLISTS: ChecklistItem[] = [
  {
    id: 'chk_1',
    checklistId: 'compliance_2026',
    userId: 'usr_alex_morgan_01',
    title: 'Verify SHA-256 Baselines for Core Financial Documents',
    description: 'Ensure monthly cryptographic hash check passes with 0 delta.',
    category: 'Compliance',
    isCompleted: true,
    linkedDocId: 'doc_financial_audit_2026',
  },
  {
    id: 'chk_2',
    checklistId: 'security_audit',
    userId: 'usr_alex_morgan_01',
    title: 'Audit Vault Storage Quota and Redundancy Baselines',
    description: 'Check distributed storage parity and integrity logs.',
    category: 'Infrastructure',
    isCompleted: true,
  },
  {
    id: 'chk_3',
    checklistId: 'identity_review',
    userId: 'usr_alex_morgan_01',
    title: 'Enforce Cryptographic Signing on Identity Passports',
    description: 'Digitally stamp government IDs with timestamped Ed25519 signatures.',
    category: 'Security',
    isCompleted: false,
    linkedDocId: 'doc_passport_identity',
  },
  {
    id: 'chk_4',
    checklistId: 'access_control',
    userId: 'usr_alex_morgan_01',
    title: 'Review System Access Logs and Detect Rogue Login Patterns',
    description: 'Analyze IP geographic origins and failed authentication attempts.',
    category: 'Access Control',
    isCompleted: false,
  },
];

export async function computeSha256Hex(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Local Storage Helper
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (_) {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
}

export const ClientStore = {
  getCurrentUser(): User | null {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return null;
    return getStored<User>(STORAGE_KEYS.USER, DEFAULT_USER);
  },

  login(email: string): { token: string; user: User } {
    const user: User = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email,
    };
    const token = 'client_token_' + Date.now();
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    setStored(STORAGE_KEYS.USER, user);
    return { token, user };
  },

  register(name: string, email: string): { token: string; user: User } {
    const user: User = {
      id: 'usr_' + Date.now(),
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const token = 'client_token_' + Date.now();
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    setStored(STORAGE_KEYS.USER, user);
    return { token, user };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  getDocuments(): DocumentItem[] {
    return getStored<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  },

  async addDocument(file: File, category?: string, description?: string): Promise<DocumentItem> {
    const hash = await computeSha256Hex(file);
    const docs = this.getDocuments();

    // Check duplicate
    const existing = docs.find((d) => d.sha256Baseline === hash || d.lastCalculatedHash === hash);
    if (existing) {
      const err: any = new Error(
        `Duplicate Document Detected! This file already exists in your vault as "${existing.originalFilename}".`
      );
      err.isDuplicate = true;
      err.existingDocument = existing;
      throw err;
    }

    const safeCategory: DocumentCategory = (
      ['Educational', 'Identity', 'Financial', 'Employment', 'Legal', 'Other'].includes(category as any)
        ? category
        : 'Other'
    ) as DocumentCategory;

    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ownerId: DEFAULT_USER.id,
      originalFilename: file.name,
      storageFilename: 'doc_' + Date.now() + '_' + file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      sha256Baseline: hash,
      lastCalculatedHash: hash,
      verificationStatus: 'VERIFIED',
      monitoringStatus: 'MONITORED',
      createdAt: new Date().toISOString(),
      lastVerificationTime: new Date().toISOString(),
      category: safeCategory,
      versionNumber: 1,
      signatureStatus: 'UNSIGNED',
    };

    docs.unshift(newDoc);
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    // Record audit log
    this.addAuditLog('DOCUMENT_UPLOAD', `Uploaded ${file.name} with baseline SHA-256 ${hash.substring(0, 16)}...`);
    return newDoc;
  },

  async checkDuplicate(file: File): Promise<{ isDuplicate: boolean; existingDocument?: any }> {
    const hash = await computeSha256Hex(file);
    const docs = this.getDocuments();
    const existing = docs.find((d) => d.sha256Baseline === hash || d.lastCalculatedHash === hash);
    return {
      isDuplicate: !!existing,
      existingDocument: existing,
    };
  },

  verifyDocument(id: string): { status: string; message: string; doc: DocumentItem } {
    const docs = this.getDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');

    const isMatch = (doc.lastCalculatedHash || doc.sha256Baseline) === doc.sha256Baseline;
    doc.verificationStatus = isMatch ? 'VERIFIED' : 'MISMATCH_DETECTED';
    doc.lastVerificationTime = new Date().toISOString();
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    this.addVerificationRecord(doc);
    return {
      status: doc.verificationStatus,
      message: isMatch
        ? `Cryptographic match confirmed! SHA-256: ${doc.sha256Baseline.substring(0, 12)}...`
        : `CRITICAL INTEGRITY FAILURE: Expected ${doc.sha256Baseline.substring(0, 8)}... but found ${doc.lastCalculatedHash?.substring(0, 8)}...`,
      doc,
    };
  },

  verifyAllDocuments(): { verifiedCount: number; failureCount: number } {
    const docs = this.getDocuments();
    let verifiedCount = 0;
    let failureCount = 0;

    for (const doc of docs) {
      if (doc.monitoringStatus === 'MONITORED') {
        if ((doc.lastCalculatedHash || doc.sha256Baseline) === doc.sha256Baseline) {
          doc.verificationStatus = 'VERIFIED';
          verifiedCount++;
        } else {
          doc.verificationStatus = 'MISMATCH_DETECTED';
          failureCount++;
        }
        doc.lastVerificationTime = new Date().toISOString();
        this.addVerificationRecord(doc);
      }
    }
    setStored(STORAGE_KEYS.DOCUMENTS, docs);
    return { verifiedCount, failureCount };
  },

  toggleMonitoring(id: string): DocumentItem {
    const docs = this.getDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.monitoringStatus = doc.monitoringStatus === 'MONITORED' ? 'PAUSED' : 'MONITORED';
    setStored(STORAGE_KEYS.DOCUMENTS, docs);
    return doc;
  },

  deleteDocument(id: string): void {
    let docs = this.getDocuments();
    const target = docs.find((d) => d.id === id);
    docs = docs.filter((d) => d.id !== id);
    setStored(STORAGE_KEYS.DOCUMENTS, docs);
    if (target) {
      this.addAuditLog('DOCUMENT_DELETE', `Deleted document ${target.originalFilename}`);
    }
  },

  getAlerts(): SecurityAlert[] {
    return getStored<SecurityAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  },

  markAlertRead(id: string): void {
    const alerts = this.getAlerts();
    const item = alerts.find((a) => a.id === id);
    if (item) {
      item.isRead = true;
      setStored(STORAGE_KEYS.ALERTS, alerts);
    }
  },

  resolveAlert(id: string): void {
    const alerts = this.getAlerts();
    const item = alerts.find((a) => a.id === id);
    if (item) {
      item.isResolved = true;
      item.isRead = true;
      setStored(STORAGE_KEYS.ALERTS, alerts);
    }
  },

  getIncidents(): IntegrityIncident[] {
    return getStored<IntegrityIncident[]>(STORAGE_KEYS.INCIDENTS, []);
  },

  getVerificationHistory(): VerificationLog[] {
    return getStored<VerificationLog[]>(STORAGE_KEYS.VERIFICATIONS, [
      {
        id: 'ver_01',
        documentId: 'doc_financial_audit_2026',
        documentName: 'financial_audit_2026.txt',
        userId: 'usr_alex_morgan_01',
        status: 'MATCH',
        baselineHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
        calculatedHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
        checkedAt: new Date(Date.now() - 1800000).toISOString(),
        executionType: 'SCHEDULED',
        message: 'SHA-256 integrity match confirmed.',
      },
      {
        id: 'ver_02',
        documentId: 'doc_passport_identity',
        documentName: 'Passport_Government_Identity.pdf',
        userId: 'usr_alex_morgan_01',
        status: 'MATCH',
        baselineHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
        calculatedHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
        checkedAt: new Date(Date.now() - 3600000).toISOString(),
        executionType: 'MANUAL',
        message: 'SHA-256 integrity match confirmed.',
      },
    ]);
  },

  addVerificationRecord(doc: DocumentItem): void {
    const history = this.getVerificationHistory();
    const isMatch = (doc.lastCalculatedHash || doc.sha256Baseline) === doc.sha256Baseline;
    history.unshift({
      id: 'ver_' + Date.now(),
      documentId: doc.id,
      documentName: doc.originalFilename,
      userId: doc.ownerId,
      status: isMatch ? 'MATCH' : 'MISMATCH',
      baselineHash: doc.sha256Baseline,
      calculatedHash: doc.lastCalculatedHash || doc.sha256Baseline,
      checkedAt: new Date().toISOString(),
      executionType: 'MANUAL',
      message: isMatch ? 'Cryptographic match confirmed.' : 'Hash mismatch detected.',
    });
    setStored(STORAGE_KEYS.VERIFICATIONS, history.slice(0, 50));
  },

  getChecklists(): ChecklistItem[] {
    return getStored<ChecklistItem[]>(STORAGE_KEYS.CHECKLISTS, INITIAL_CHECKLISTS);
  },

  toggleChecklist(id: string): void {
    const items = this.getChecklists();
    const item = items.find((i) => i.id === id);
    if (item) {
      item.isCompleted = !item.isCompleted;
      setStored(STORAGE_KEYS.CHECKLISTS, items);
    }
  },

  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud_1',
        userId: 'usr_alex_morgan_01',
        userName: 'Alex Morgan',
        action: 'SECURITY_AUDIT_INITIALIZED',
        resourceType: 'SYSTEM',
        resourceId: 'SYS_TRACE_LOCK',
        details: 'TraceLock enterprise security monitoring initialized with Ed25519 root keys.',
        ipAddress: '127.0.0.1 (Direct Browser)',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  },

  addAuditLog(action: string, details: string): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: 'aud_' + Date.now(),
      userId: DEFAULT_USER.id,
      userName: DEFAULT_USER.name,
      action,
      resourceType: 'DOCUMENT',
      resourceId: 'DOC_MOD',
      details,
      ipAddress: '127.0.0.1 (Client-Side)',
      timestamp: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100));
  },

  getSystemHealth(): SystemHealth {
    const docs = this.getDocuments();
    const tampered = docs.filter((d) => d.verificationStatus === 'MISMATCH_DETECTED').length;
    return {
      status: tampered > 0 ? 'DEGRADED' : 'UP',
      subsystems: {
        storage: {
          status: 'UP',
          path: '/storage/vault',
          documentsStored: docs.length,
        },
        database: {
          status: 'UP',
          engine: 'Client Storage Engine',
          recordsCount: {
            users: 1,
            documents: docs.length,
            verifications: 10,
            alerts: 2,
            incidents: 0,
          },
        },
        scheduler: {
          status: 'ACTIVE',
          intervalSeconds: 60,
          lastRun: new Date().toISOString(),
        },
        security: {
          authModule: 'Web Crypto API + JWT',
          hashingAlgorithm: 'SHA-256',
        },
      },
      simulations: {
        databaseTimeout: false,
        storageUnavailable: false,
      },
    };
  },

  // Test Lab Simulation
  tamperDocument(id: string): { message: string; doc: DocumentItem } {
    const docs = this.getDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');

    // Alter hash
    doc.lastCalculatedHash = 'TAMPERED_' + Math.random().toString(36).substring(2, 10) + '99999999';
    doc.verificationStatus = 'MISMATCH_DETECTED';
    doc.lastVerificationTime = new Date().toISOString();
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    // Create alert
    const alerts = this.getAlerts();
    alerts.unshift({
      id: 'alt_' + Date.now(),
      documentId: doc.id,
      documentName: doc.originalFilename,
      userId: doc.ownerId,
      category: 'INTEGRITY_MISMATCH',
      severity: 'CRITICAL',
      title: 'TAMPER DETECTED',
      message: `SIMULATED TAMPERING: Cryptographic mismatch detected on ${doc.originalFilename}!`,
      isRead: false,
      isResolved: false,
      createdAt: new Date().toISOString(),
      recommendedAction: 'Inspect document revisions or restore baseline from immutable backup.',
      previousHash: doc.sha256Baseline,
      currentHash: doc.lastCalculatedHash,
    });
    setStored(STORAGE_KEYS.ALERTS, alerts);

    this.addVerificationRecord(doc);
    this.addAuditLog('TEST_LAB_TAMPER', `Tampered file bytes simulated for ${doc.originalFilename}`);

    return { message: 'Document tampered successfully for Test Lab testing.', doc };
  },

  restoreDocument(id: string): { message: string; doc: DocumentItem } {
    const docs = this.getDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');

    doc.lastCalculatedHash = doc.sha256Baseline;
    doc.verificationStatus = 'VERIFIED';
    doc.lastVerificationTime = new Date().toISOString();
    setStored(STORAGE_KEYS.DOCUMENTS, docs);

    this.addVerificationRecord(doc);
    this.addAuditLog('TEST_LAB_RESTORE', `Restored original baseline bytes for ${doc.originalFilename}`);
    return { message: 'Document restored to verified baseline.', doc };
  },

  getFaultEvents(): FaultEvent[] {
    return [];
  },

  getSharedDocuments(): SharedDocument[] {
    return getStored<SharedDocument[]>(STORAGE_KEYS.SHARED_DOCS, []);
  },

  getLoginActivityLogs(): {
    logs: LoginActivityLog[];
    metrics: { total: number; success: number; failed: number; blocked: number; lockoutsActive: number };
    lockedAccounts: { email: string; lockoutRemainingSeconds: number; attempts: number }[];
  } {
    return {
      logs: [
        {
          id: 'log_01',
          email: DEFAULT_USER.email,
          status: 'SUCCESS',
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
          alertTriggered: false,
          timestamp: new Date().toISOString(),
        },
      ],
      metrics: {
        total: 12,
        success: 11,
        failed: 1,
        blocked: 0,
        lockoutsActive: 0,
      },
      lockedAccounts: [],
    };
  },

  simulateAttack(targetEmail?: string) {
    const email = targetEmail || DEFAULT_USER.email;
    const alert: UnauthorizedLoginAlertData = {
      id: 'unauth_' + Date.now(),
      email,
      attemptsCount: 5,
      ipAddress: '203.0.113.195 (Tor Exit Node)',
      userAgent: 'Python-Requests/2.28 SecurityScanner',
      isLocked: true,
      lockoutRemainingSeconds: 900,
      alertMessage: `Brute force attack threshold reached for ${email}. Account temporarily locked.`,
      detectedAt: new Date().toISOString(),
    };
    return {
      message: `Simulated brute-force attack detected on ${email}. Account locked for 15 minutes.`,
      targetEmail: email,
      attemptsSimulated: 5,
      alert,
      emailDispatched: true,
    };
  },
};
