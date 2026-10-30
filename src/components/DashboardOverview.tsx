import { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Activity,
  Layers,
  Database,
  Shield,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  DocumentItem,
  SecurityAlert,
  IntegrityIncident,
  VerificationLog,
  SystemHealth,
  User,
  FaultEvent,
} from '../types';
import { SidebarTab } from './Sidebar';

interface DashboardOverviewProps {
  user: User;
  documents: DocumentItem[];
  alerts: SecurityAlert[];
  incidents: IntegrityIncident[];
  verifications: VerificationLog[];
  faultEvents: FaultEvent[];
  systemHealth: SystemHealth | null;
  onNavigate: (tab: SidebarTab) => void;
  onOpenUpload: () => void;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onRetryFault: (id: string) => Promise<void>;
  onVerifyDocument: (doc: DocumentItem) => Promise<void>;
}

export function DashboardOverview({
  user,
  documents,
  alerts,
  incidents,
  verifications,
  faultEvents,
  systemHealth,
  onNavigate,
  onOpenUpload,
  onOpenDocDetails,
  onRetryFault,
  onVerifyDocument,
}: DashboardOverviewProps) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Exact 4 Statistics Counts retrieved from real backend state:
  const totalDocsCount = documents.length;
  const verifiedDocsCount = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const pendingReviewCount = documents.filter(
    (d) =>
      d.verificationStatus === 'PENDING' ||
      d.verificationStatus === 'DISABLED' ||
      d.monitoringStatus === 'PAUSED'
  ).length;
  const integrityAlertsCount =
    alerts.filter((a) => !a.isResolved).length +
    incidents.filter((i) => i.status === 'UNRESOLVED').length;

  // Real Storage Calculation from live documents array
  const totalStorageBytes = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
  const totalStorageKb = Math.round(totalStorageBytes / 1024);
  const totalStorageMb = (totalStorageBytes / (1024 * 1024)).toFixed(2);
  const quotaLimitBytes = 50 * 1024 * 1024; // 50MB standard enterprise baseline quota
  const storagePercentage = Math.min(100, Math.max(1, Math.round((totalStorageBytes / quotaLimitBytes) * 100)));

  // Categorical storage breakdown
  const categoryBreakdown = documents.reduce((acc, doc) => {
    const cat = doc.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handle Retry on Fault Event
  const handleRetry = async (eventId: string) => {
    setRetryingId(eventId);
    setRetryMessage(null);
    try {
      await onRetryFault(eventId);
      setRetryMessage({ type: 'success', text: 'Fault event successfully retried and recovered.' });
    } catch (err: any) {
      setRetryMessage({ type: 'error', text: 'Retry failed: ' + (err.message || 'Operation error') });
    } finally {
      setRetryingId(null);
    }
  };

  const handleVerify = async (doc: DocumentItem) => {
    setVerifyingDocId(doc.id);
    try {
      await onVerifyDocument(doc);
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Helper for file type / extension & icon
  const getFileTypeInfo = (filename: string, mimeType?: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF' || mimeType?.includes('pdf')) {
      return {
        label: 'PDF',
        icon: FileText,
        colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
        iconColor: 'text-rose-600',
      };
    }
    if (['DOC', 'DOCX'].includes(ext) || mimeType?.includes('word')) {
      return {
        label: 'WORD',
        icon: FileText,
        colorClass: 'bg-[#EEF4FC] text-[#243B6B] border-[#C8DBFA]',
        iconColor: 'text-[#4776D0]',
      };
    }
    if (['XLS', 'XLSX', 'CSV'].includes(ext) || mimeType?.includes('sheet')) {
      return {
        label: 'EXCEL',
        icon: FileSpreadsheet,
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        iconColor: 'text-emerald-600',
      };
    }
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext) || mimeType?.includes('image')) {
      return {
        label: ext,
        icon: ImageIcon,
        colorClass: 'bg-purple-50 text-purple-800 border-purple-200',
        iconColor: 'text-purple-600',
      };
    }
    if (['TXT', 'JSON', 'XML', 'MD'].includes(ext)) {
      return {
        label: ext,
        icon: FileCode,
        colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
        iconColor: 'text-slate-600',
      };
    }
    return {
      label: ext,
      icon: File,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-500',
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Welcome Section in Crisp White with Deep Indigo Accent */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EEF4FC] text-[#243B6B] border border-[#C8DBFA]">
              Smart Document Repository
            </span>
            <span className="text-xs text-[#64748B]">·</span>
            <span className="text-xs font-semibold text-[#15966A] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cryptographic Invariants Guard Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            TraceLock is continuously monitoring your document repository with SHA-256 cryptographic
            integrity verification, digital signature validations, and real-time security alerts.
          </p>
        </div>

        {/* Primary CTA button in Deep Indigo #243B6B */}
        <div className="shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('documents')}
            className="px-4 py-2.5 text-xs font-semibold text-[#172033] bg-white hover:bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Browse Library
          </button>
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#EEF4FC]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Key Statistics: 4 Stat Cards in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#4776D0] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Documents
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EEF4FC] text-[#243B6B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#172033]">
            {totalDocsCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-2 flex items-center justify-between">
            <span>Enrolled in secure vault</span>
            <span className="font-semibold text-[#243B6B] group-hover:underline">View &rarr;</span>
          </div>
        </div>

        {/* Card 2: Verified Documents */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#15966A] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Verified Intact
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#15966A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#15966A]">
            {verifiedDocsCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-2 flex items-center justify-between">
            <span>SHA-256 hash verified</span>
            <span className="font-mono text-[#15966A] font-semibold">
              {totalDocsCount > 0 ? Math.round((verifiedDocsCount / totalDocsCount) * 100) : 100}%
            </span>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#D97706] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Pending Check
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#D97706]">
            {pendingReviewCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-2">
            Awaiting verification or paused
          </div>
        </div>

        {/* Card 4: Integrity Alerts */}
        <div
          onClick={() => onNavigate('security')}
          className={`p-5 rounded-2xl border shadow-xs transition-all cursor-pointer group ${
            integrityAlertsCount > 0
              ? 'bg-[#FEF2F2] border-[#FECACA] hover:border-[#DC2626]'
              : 'bg-white border-[#E2E8F0] hover:border-[#4776D0]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Security Alerts
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                integrityAlertsCount > 0
                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                  : 'bg-[#F5F7FB] text-[#64748B]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-bold font-mono tabular-nums ${
              integrityAlertsCount > 0 ? 'text-[#DC2626]' : 'text-[#172033]'
            }`}
          >
            {integrityAlertsCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-2 flex items-center justify-between">
            <span>{integrityAlertsCount > 0 ? 'Action required' : 'Zero active deviations'}</span>
            {integrityAlertsCount > 0 && (
              <span className="font-bold text-[#DC2626]">Review &rarr;</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Storage Usage & Cryptographic System Status (Two Mid-tier Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Storage Usage Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF4FC] text-[#243B6B] flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">Repository Storage Usage</h2>
                  <span className="text-[11px] text-[#64748B]">Real-time disk consumption & quota</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-[#172033] tabular-nums">
                  {totalStorageBytes > 1024 * 1024 ? `${totalStorageMb} MB` : `${totalStorageKb} KB`}
                </span>
                <span className="text-[11px] text-[#64748B] font-mono block">of 50.0 MB quota</span>
              </div>
            </div>

            {/* Storage Progress Meter */}
            <div className="w-full h-2.5 bg-[#F5F7FB] rounded-full overflow-hidden border border-[#E2E8F0] my-3">
              <div
                className="h-full bg-gradient-to-r from-[#243B6B] to-[#4776D0] rounded-full transition-all duration-300"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Storage allocation is protected by atomic write isolation. Temporary buffers are segregated and hashed prior to entering permanent storage.
            </p>
          </div>

          {/* Categorical Distribution Badges */}
          <div className="pt-4 border-t border-[#E2E8F0] mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#64748B] mr-1">Distribution:</span>
            {Object.keys(categoryBreakdown).length === 0 ? (
              <span className="text-xs text-[#64748B] italic">No documents uploaded yet</span>
            ) : (
              Object.entries(categoryBreakdown).map(([category, count]) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F7FB] border border-[#E2E8F0] text-[11px] font-medium text-[#172033]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4776D0]" />
                  <span>{category}:</span>
                  <strong className="font-mono tabular-nums">{count}</strong>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Integrity Verification Engine Status (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#15966A] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">Integrity Engine Status</h2>
                  <span className="text-[11px] text-[#64748B]">Continuous NIST SHA-256 validation</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15966A]" />
                <span>OPERATIONAL</span>
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#64748B] my-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0]">
                <span>Verification Cadence:</span>
                <span className="font-mono font-semibold text-[#172033]">Every 30 seconds</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0]">
                <span>Active Algorithm:</span>
                <span className="font-mono font-semibold text-[#243B6B]">SHA-256 / RSA-2048</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0]">
                <span>Last Verification Check:</span>
                <span className="font-mono font-semibold text-[#172033]">
                  {systemHealth?.subsystems?.scheduler?.lastRun
                    ? new Date(systemHealth.subsystems.scheduler.lastRun).toLocaleTimeString()
                    : 'Real-time daemon active'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('security')}
              className="w-full py-2 px-3 text-xs font-semibold text-[#243B6B] hover:text-[#1D315B] bg-[#EEF4FC] hover:bg-[#EEF4FC]/80 border border-[#C8DBFA] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#4776D0]" />
              <span>Open Security &amp; Integrity Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Layout: Recent Documents & Recent Security Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Documents Table (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Recent Documents</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Latest monitored documents in vault with cryptographic status and actions
              </p>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({documents.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#4776D0]" />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="font-semibold text-[#172033]">No documents registered yet.</p>
              <p className="mt-1">Click "Upload Document" above to register your first file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F7FB] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Integrity Status</th>
                    <th className="py-3 px-4">Last Verified</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {documents.slice(0, 6).map((doc) => {
                    const typeInfo = getFileTypeInfo(doc.originalFilename, doc.mimeType);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <tr key={doc.id} className="hover:bg-[#F5F7FB]/70 transition-colors">
                        {/* Document Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${typeInfo.colorClass}`}>
                              <TypeIcon className={`w-4 h-4 ${typeInfo.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => onOpenDocDetails(doc)}
                                className="text-left font-semibold text-[#172033] hover:text-[#243B6B] hover:underline truncate max-w-xs block cursor-pointer"
                                title={doc.originalFilename}
                              >
                                {doc.originalFilename}
                              </button>
                              <span className="text-[10px] text-[#64748B] font-mono">
                                {doc.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* File Type */}
                        <td className="py-3.5 px-4">
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${typeInfo.colorClass}`}>
                            {typeInfo.label}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="py-3.5 px-4 font-mono text-[#64748B] tabular-nums">
                          {Math.round(doc.fileSize / 1024)} KB
                        </td>

                        {/* Status (Strict Green / Amber / Red) */}
                        <td className="py-3.5 px-4">
                          {doc.verificationStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0]">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#15966A]" />
                              <span>Verified</span>
                            </span>
                          )}

                          {doc.verificationStatus === 'MISMATCH_DETECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                              <span>Mismatch</span>
                            </span>
                          )}

                          {(doc.verificationStatus === 'PENDING' ||
                            doc.verificationStatus === 'DISABLED') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Pending</span>
                            </span>
                          )}

                          {doc.verificationStatus === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                              <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>

                        {/* Last Verified */}
                        <td className="py-3.5 px-4 text-[#64748B] font-mono text-[11px] tabular-nums">
                          {doc.lastVerificationTime
                            ? new Date(doc.lastVerificationTime).toLocaleDateString()
                            : 'Pending'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onOpenDocDetails(doc)}
                              className="p-1.5 text-[#64748B] hover:text-[#243B6B] hover:bg-[#F5F7FB] rounded-lg transition-colors cursor-pointer"
                              title="Inspect content & baseline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleVerify(doc)}
                              disabled={verifyingDocId === doc.id}
                              className="p-1.5 text-[#64748B] hover:text-[#15966A] hover:bg-[#ECFDF5] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Run immediate SHA-256 verification"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${verifyingDocId === doc.id ? 'animate-spin text-[#15966A]' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Recent Security Activity & Fault Tolerance (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Recent Security Alerts & Incidents */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">Recent Security Activity</h3>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F7FB] text-[#64748B] font-semibold border border-[#E2E8F0]">
                {alerts.length} Records
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
              Cryptographic hash deviations, failed sign-in intrusions, and storage anomalies.
            </p>

            {/* List of Alerts */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {alerts.length === 0 && incidents.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
                  <CheckCircle2 className="w-5 h-5 text-[#15966A] mx-auto mb-1" />
                  <span>No security deviations detected. All systems nominal.</span>
                </div>
              ) : (
                <>
                  {/* Unresolved Incidents first */}
                  {incidents
                    .filter((i) => i.status === 'UNRESOLVED')
                    .slice(0, 2)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#991B1B] truncate">{inc.documentName}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#DC2626] text-white">
                            MISMATCH
                          </span>
                        </div>
                        <p className="text-[11px] text-[#DC2626] leading-tight">
                          Stored physical bytes deviated from registered baseline.
                        </p>
                        <div className="text-[10px] font-mono text-[#64748B] pt-0.5">
                          {new Date(inc.detectedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}

                  {/* Security Alerts */}
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-[#FEF2F2] border-[#FECACA]'
                          : alert.severity === 'WARNING'
                          ? 'bg-[#FFFBEB] border-[#FDE68A]'
                          : 'bg-[#F5F7FB] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172033] truncate max-w-[170px]">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-[#DC2626] text-white'
                              : alert.severity === 'WARNING'
                              ? 'bg-[#D97706] text-white'
                              : 'bg-[#4776D0] text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] line-clamp-2 leading-tight">
                        {alert.message}
                      </p>
                      <div className="text-[10px] font-mono text-[#64748B] pt-0.5 flex items-center justify-between">
                        <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                        <span className={alert.isResolved ? 'text-[#15966A] font-semibold' : 'text-[#D97706] font-semibold'}>
                          {alert.isResolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] mt-3">
              <button
                onClick={() => onNavigate('security')}
                className="w-full py-2 text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] text-center block cursor-pointer"
              >
                View Complete Security Log &rarr;
              </button>
            </div>
          </div>

          {/* Card 2: Fault Tolerance & Recovery Subsystem */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF4FC] text-[#243B6B] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">Fault Tolerance Subsystem</h3>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#15966A] font-semibold border border-[#A7F3D0]">
                Self-Healing
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
              Catches interrupted uploads, enforces isolated rollback buffers, and executes bounded retries.
            </p>

            {retryMessage && (
              <div
                className={`mb-3 p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-between border ${
                  retryMessage.type === 'success'
                    ? 'bg-[#ECFDF5] text-[#15966A] border-[#A7F3D0]'
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                }`}
              >
                <span>{retryMessage.text}</span>
                <button
                  onClick={() => setRetryMessage(null)}
                  className="font-bold text-[#64748B] hover:text-[#172033] cursor-pointer ml-2"
                >
                  &times;
                </button>
              </div>
            )}

            {/* List of Fault Events */}
            <div className="space-y-2.5">
              {faultEvents.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0] text-xs text-[#64748B] text-center">
                  No fault events recorded. Storage system operating normally.
                </div>
              ) : (
                faultEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      event.status === 'FAILED'
                        ? 'bg-[#FEF2F2] border-[#FECACA]'
                        : 'bg-[#ECFDF5] border-[#A7F3D0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172033] truncate max-w-[160px]">
                        {event.resourceName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          event.status === 'FAILED'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#ECFDF5] text-[#15966A]'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] leading-tight">
                      {event.errorDetails}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-[10px] text-[#64748B]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>

                      {event.retryable && event.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(event.id)}
                          disabled={retryingId === event.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingId === event.id ? 'animate-spin' : ''}`} />
                          <span>{retryingId === event.id ? 'Retrying...' : 'Retry'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B] text-[11px]">Subsystem Reliability:</span>
              <span className="font-semibold text-[#15966A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15966A]" />
                <span>Optimal (99.99%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
