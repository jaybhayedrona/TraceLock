import { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  Code,
  Sparkles,
  Maximize2,
  PenTool,
  ShieldAlert,
  History,
  UploadCloud,
  Key,
  FileSignature,
  Link2,
  Shield,
} from 'lucide-react';
import {
  DocumentItem,
  DocumentSignature,
  DocumentVersion,
  DocumentAuditRecord,
} from '../types';
import {
  verifyDocument,
  downloadDocument,
  getDocumentContent,
  getDocumentViewUrl,
  DocumentContentResponse,
  signDocument,
  verifyDocumentSignature,
  getDocumentSignatures,
  getDocumentVersions,
  createDocumentVersion,
  getDocumentAuditTrail,
  verifyDocumentAuditChain,
} from '../api';

interface DocumentDetailsModalProps {
  document: DocumentItem | null;
  initialTab?: 'preview' | 'crypto' | 'signature' | 'audit';
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function DocumentDetailsModal({
  document,
  initialTab = 'preview',
  onClose,
  onRefresh,
}: DocumentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'crypto' | 'signature' | 'audit'>(initialTab);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Content state for local viewing
  const [contentData, setContentData] = useState<DocumentContentResponse | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'iframe' | 'raw'>('formatted');

  // Digital Signatures state
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [signing, setSigning] = useState(false);
  const [verifyingSig, setVerifyingSig] = useState(false);
  const [sigVerificationResult, setSigVerificationResult] = useState<{
    status: 'VALID' | 'INVALID';
    isMatch: boolean;
    message: string;
    signerName?: string;
    signedAt?: string;
    algorithm?: string;
    publicKeyFingerprint?: string;
    currentHash?: string;
    signedHash?: string;
  } | null>(null);

  // Versions state
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionSummary, setVersionSummary] = useState('');
  const [uploadingVersion, setUploadingVersion] = useState(false);

  // Document Audit Trail state
  const [auditRecords, setAuditRecords] = useState<DocumentAuditRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState<{
    isValid: boolean;
    chainLength: number;
    brokenRecordId?: string;
    error?: string;
  } | null>(null);

  // Sync initialTab when modal opens with a new document
  useEffect(() => {
    if (document) {
      setActiveTab(initialTab);
      setActionMessage(null);
      setSigVerificationResult(null);
      setChainResult(null);
      setShowVersionUpload(false);
      setVersionFile(null);
      setVersionSummary('');

      // Load local content preview
      setLoadingContent(true);
      setContentError(null);
      getDocumentContent(document.id)
        .then((data) => {
          setContentData(data);
          if (data.isImage) {
            setViewMode('iframe');
          } else {
            setViewMode('formatted');
          }
        })
        .catch((err) => {
          setContentError(err.message || 'Failed to load local document bytes');
        })
        .finally(() => {
          setLoadingContent(false);
        });

      // Load signatures & versions
      loadSignaturesAndVersions(document.id);

      // Load audit trail
      loadAuditTrail(document.id);
    }
  }, [document, initialTab]);

  const loadSignaturesAndVersions = async (docId: string) => {
    setLoadingSignatures(true);
    setLoadingVersions(true);
    try {
      const [sigs, vers] = await Promise.all([
        getDocumentSignatures(docId),
        getDocumentVersions(docId),
      ]);
      setSignatures(sigs);
      setVersions(vers);
    } catch (e) {
      console.error('Failed to load signatures or versions', e);
    } finally {
      setLoadingSignatures(false);
      setLoadingVersions(false);
    }
  };

  const loadAuditTrail = async (docId: string) => {
    setLoadingAudit(true);
    try {
      const recs = await getDocumentAuditTrail(docId);
      setAuditRecords(recs);
    } catch (e) {
      console.error('Failed to load document audit records', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (!document) return null;

  const viewUrl = getDocumentViewUrl(document.id);

  const handleVerify = async () => {
    setVerifying(true);
    setActionMessage(null);
    try {
      const res = await verifyDocument(document.id);
      await onRefresh();
      if (res.isMatch) {
        setActionMessage({
          type: 'success',
          text: 'No content changes detected. SHA-256 cryptographic signature matches baseline reference.',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `CRITICAL MISMATCH DETECTED! Computed storage hash (${res.calculatedHash?.substring(0, 16)}...) deviates from baseline.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Verification unavailable due to storage or system error.',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Sign Document Handler
  const handleSignDocument = async () => {
    setSigning(true);
    setActionMessage(null);
    try {
      const res = await signDocument(document.id);
      await onRefresh();
      await loadSignaturesAndVersions(document.id);
      await loadAuditTrail(document.id);
      setActionMessage({
        type: 'success',
        text: `Document successfully signed using RSA-2048 (SHA256withRSA) by ${res.signature.signerName}.`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Signing failed. Only authorized users can digitally sign.',
      });
    } finally {
      setSigning(false);
    }
  };

  // Verify Digital Signature Handler
  const handleVerifySignature = async () => {
    setVerifyingSig(true);
    setSigVerificationResult(null);
    try {
      const res = await verifyDocumentSignature(document.id);
      setSigVerificationResult(res);
      await onRefresh();
      await loadAuditTrail(document.id);
      if (res.status === 'VALID' && res.isMatch) {
        setActionMessage({
          type: 'success',
          text: res.message || 'Signature Verified: Document matches the signed version and the digital signature is valid.',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: res.message || 'Signature Invalid: Verification failed or the document no longer matches the signed version.',
        });
      }
    } catch (err: any) {
      setSigVerificationResult({
        status: 'INVALID',
        isMatch: false,
        message: err.message || 'Verification error encountered.',
      });
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to verify signature.',
      });
    } finally {
      setVerifyingSig(false);
    }
  };

  // Upload New Version (Edit Document)
  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile) return;

    setUploadingVersion(true);
    setActionMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', versionFile);
      formData.append('changeSummary', versionSummary || 'Uploaded modified version');

      await createDocumentVersion(document.id, formData);
      setShowVersionUpload(false);
      setVersionFile(null);
      setVersionSummary('');
      await onRefresh();
      await loadSignaturesAndVersions(document.id);
      await loadAuditTrail(document.id);

      setActionMessage({
        type: 'success',
        text: 'New document version created! Previous signed version and history are preserved. New version is ready for separate digital signing.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to create new document version.',
      });
    } finally {
      setUploadingVersion(false);
    }
  };

  // Verify Audit Trail Hash Chain
  const handleVerifyAuditChain = async () => {
    setVerifyingChain(true);
    setChainResult(null);
    try {
      const res = await verifyDocumentAuditChain(document.id);
      setChainResult(res);
      if (res.isValid) {
        setActionMessage({
          type: 'success',
          text: `Cryptographic audit hash chain verified! All ${res.chainLength} ledger records are linked and tamper-free.`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `Audit chain integrity failure! Record ${res.brokenRecordId} breaks cryptographic link.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to verify audit hash chain.',
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadDocument(document.id, document.originalFilename);
      await loadAuditTrail(document.id);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Download failed. Ensure the document is available in storage.',
      });
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(document.sha256Baseline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyContent = () => {
    if (contentData?.textContent) {
      navigator.clipboard.writeText(contentData.textContent);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const activeSignature = signatures.find(s => s.id === document.activeSignatureId) || signatures[0];
  const isImage = document.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#243B6B] px-5 py-3.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {activeTab === 'preview' && <FileText className="w-4 h-4 text-[#EEF4FC]" />}
              {activeTab === 'crypto' && <Lock className="w-4 h-4 text-[#EEF4FC]" />}
              {activeTab === 'signature' && <PenTool className="w-4 h-4 text-[#EEF4FC]" />}
              {activeTab === 'audit' && <History className="w-4 h-4 text-[#EEF4FC]" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate leading-tight flex items-center gap-2">
                <span>{document.originalFilename}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/20 text-[#EEF4FC]">
                  v{document.versionNumber || 1}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-[#EEF4FC]/80 mt-0.5">
                <span className="font-medium">{document.category}</span>
                <span>•</span>
                <span className="font-mono tabular-nums">{Math.round(document.fileSize / 1024)} KB</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-[#15966A]" />
                  <span>SHA-256 Protected</span>
                </span>
                {document.isFamilyVault && (
                  <>
                    <span>•</span>
                    <span className="text-[#EEF4FC] bg-white/20 px-1.5 py-0.5 rounded font-semibold text-[9px]">
                      Family Vault
                    </span>
                  </>
                )}
                {document.expiryDate && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">
                      Exp: {document.expiryDate}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold">
                  {document.signatureStatus === 'SIGNED' ? (
                    <span className="text-emerald-300 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-[#15966A]" /> Digitally Signed
                    </span>
                  ) : document.signatureStatus === 'INVALID' ? (
                    <span className="text-rose-300 flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3 text-[#DC2626]" /> Signature Invalid
                    </span>
                  ) : (
                    <span className="text-slate-200">Unsigned</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg transition-colors cursor-pointer text-white"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              title="Close modal"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Tab Switcher Strip */}
        <div className="bg-[#F5F7FB] border-b border-[#E2E8F0] px-5 pt-2 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-[#243B6B] border-[#243B6B] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033] border-transparent hover:bg-white/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#4776D0]" />
              <span>Document Content</span>
            </button>

            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'crypto'
                  ? 'bg-white text-[#243B6B] border-[#243B6B] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033] border-transparent hover:bg-white/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#243B6B]" />
              <span>Cryptographic Baseline</span>
            </button>

            <button
              onClick={() => setActiveTab('signature')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'signature'
                  ? 'bg-white text-[#243B6B] border-[#243B6B] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033] border-transparent hover:bg-white/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-[#4776D0]" />
              <span>Digital Signatures</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  document.signatureStatus === 'SIGNED'
                    ? 'bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0]'
                    : document.signatureStatus === 'INVALID'
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    : 'bg-[#F5F7FB] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                {document.signatureStatus || 'UNSIGNED'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-[#243B6B] border-[#243B6B] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033] border-transparent hover:bg-white/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#243B6B]" />
              <span>Audit Trail</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E2E8F0] text-[#172033]">
                {auditRecords.length}
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] pb-2 font-mono text-[#64748B]">
            <span>SHA-256:</span>
            <span className="text-[#243B6B] font-bold">
              {document.sha256Baseline.substring(0, 10)}...{document.sha256Baseline.substring(58)}
            </span>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shrink-0 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LOCAL DOCUMENT CONTENT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-[#F5F7FB] p-2.5 rounded-xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#64748B] mr-1">View Mode:</span>
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'formatted'
                        ? 'bg-[#243B6B] text-white shadow-2xs'
                        : 'bg-white text-[#172033] hover:bg-[#EEF4FC] border border-[#E2E8F0]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#4776D0]" />
                    <span>Formatted Document</span>
                  </button>

                  <button
                    onClick={() => setViewMode('iframe')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'iframe'
                        ? 'bg-[#243B6B] text-white shadow-2xs'
                        : 'bg-white text-[#172033] hover:bg-[#EEF4FC] border border-[#E2E8F0]'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Live File Viewer</span>
                  </button>

                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'raw'
                        ? 'bg-[#243B6B] text-white shadow-2xs'
                        : 'bg-white text-[#172033] hover:bg-[#EEF4FC] border border-[#E2E8F0]'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>Raw Text Stream</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {contentData?.textContent && (
                    <button
                      onClick={handleCopyContent}
                      className="px-2.5 py-1 text-xs font-medium text-[#172033] bg-white hover:bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedContent ? <Check className="w-3 h-3 text-[#15966A]" /> : <Copy className="w-3 h-3 text-[#64748B]" />}
                      <span>{copiedContent ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {loadingContent && (
                <div className="py-16 text-center text-[#64748B] text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#4776D0]" />
                  <span>Loading local document bytes from secure repository...</span>
                </div>
              )}

              {contentError && !loadingContent && (
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>{contentError}</span>
                </div>
              )}

              {!loadingContent && viewMode === 'formatted' && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden font-sans">
                  <div className="absolute right-6 top-6 opacity-5 pointer-events-none select-none">
                    <ShieldCheck className="w-32 h-32 text-[#243B6B]" />
                  </div>

                  <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#243B6B]">
                        TraceLock Smart Document Repository
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#172033] tracking-tight mt-0.5">
                        {document.originalFilename}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF4FC] text-[#243B6B] font-bold border border-[#C8DBFA]">
                          {document.category} Document
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F7FB] text-[#64748B] font-mono border border-[#E2E8F0]">
                          v{document.versionNumber || 1}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>VERIFIED AUTHENTIC</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-1">
                        Vault ID: {document.id}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/80 leading-relaxed text-slate-800 text-xs space-y-3">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileSearch className="w-4 h-4 text-[#243B6B]" />
                      <span>Document Record & Content Summary</span>
                    </div>

                    {contentData?.textContent ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap font-mono text-[11px] text-slate-800 leading-relaxed max-h-72 overflow-y-auto shadow-2xs">
                        {contentData.textContent}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-slate-600 text-xs leading-relaxed">
                        This binary document is securely archived in TraceLock private storage. You can inspect its physical stream using the <strong>Live File Viewer</strong> tab or download the pristine file directly.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-200">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Format & Size</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                        {document.mimeType} ({document.fileSize} bytes)
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Digital Signature</span>
                      <span className="font-semibold mt-0.5 block">
                        {document.signatureStatus === 'SIGNED' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Signed (RSA-2048)
                          </span>
                        ) : (
                          <span className="text-slate-500">Unsigned</span>
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">SHA-256 Digest</span>
                      <span className="font-mono text-[10px] text-[#243B6B] font-bold mt-0.5 block truncate" title={document.sha256Baseline}>
                        {document.sha256Baseline.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!loadingContent && viewMode === 'iframe' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Rendering file directly from local storage via authenticated stream</span>
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#243B6B] font-semibold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Browser Window</span>
                    </a>
                  </div>

                  <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden h-[500px] flex items-center justify-center relative">
                    {isImage ? (
                      <img
                        src={viewUrl}
                        alt={document.originalFilename}
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <iframe
                        src={viewUrl}
                        title={document.originalFilename}
                        className="w-full h-full border-none"
                      />
                    )}
                  </div>
                </div>
              )}

              {!loadingContent && viewMode === 'raw' && (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] bg-slate-900 text-slate-100 p-4 rounded-2xl overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
                    {contentData?.textContent || 'Binary stream — raw text rendering not available for this binary format.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRYPTOGRAPHIC BASELINE & SHA-256 */}
          {activeTab === 'crypto' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-medium">Algorithm</span>
                  <span className="font-mono text-slate-800 font-bold mt-0.5 block">SHA-256 (256-bit)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-medium">Document Version</span>
                  <span className="font-mono text-slate-800 font-bold mt-0.5 block">v{document.versionNumber || 1}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-medium">Exact File Bytes</span>
                  <span className="font-mono text-slate-800 font-bold mt-0.5 block">{document.fileSize} bytes</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-medium">Registered Date</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#243B6B] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4776D0]" />
                    <span>Protected SHA-256 Reference Baseline</span>
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="text-[10px] text-[#64748B] hover:text-[#172033] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#15966A]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] break-all text-[#172033] bg-white p-2.5 rounded-lg border border-[#E2E8F0] select-all">
                  {document.sha256Baseline}
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  Calculated automatically upon document ingestion. Baseline can only be updated through verified administrative approval.
                </p>
              </div>

              <div className="p-3.5 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Latest Computed Storage Hash</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    {document.lastVerificationTime
                      ? new Date(document.lastVerificationTime).toLocaleString()
                      : 'Pending check'}
                  </span>
                </div>
                <div
                  className={`font-mono text-[11px] break-all p-2.5 rounded-lg border select-all ${
                    document.verificationStatus === 'MISMATCH_DETECTED'
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                      : 'bg-white border-[#E2E8F0] text-[#172033]'
                  }`}
                >
                  {document.lastCalculatedHash || document.sha256Baseline}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0] text-[#172033]">
                <div className="font-bold text-[#243B6B] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#15966A]" />
                  <span>Integrity Evaluation Verdict:</span>
                </div>
                {document.verificationStatus === 'VERIFIED' && (
                  <p className="text-xs leading-relaxed text-[#15966A] font-medium">
                    Mathematical match confirmed. The SHA-256 digest of physical storage bytes is identical to the registered baseline reference.
                  </p>
                )}
                {document.verificationStatus === 'MISMATCH_DETECTED' && (
                  <p className="text-xs leading-relaxed text-[#DC2626] font-semibold">
                    CRITICAL WARNING: The physical bytes stored on disk deviate from the baseline reference.
                  </p>
                )}
                {document.verificationStatus === 'FAILED' && (
                  <p className="text-xs leading-relaxed text-[#D97706]">
                    Verification unavailable: Storage subsystem error. File could not be accessed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIGITAL SIGNATURES (RSA-2048 & VERIFICATION) */}
          {activeTab === 'signature' && (
            <div className="space-y-5 text-xs">
              {/* Primary Signature Actions Bar */}
              <div className="bg-[#EEF4FC] p-4 rounded-xl border border-[#C8DBFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#243B6B] text-sm flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-[#4776D0]" />
                    <span>RSA-2048 Digital Signature &amp; Public Key Cryptography</span>
                  </div>
                  <p className="text-[#64748B] text-[11px] mt-0.5">
                    Digitally signs the exact document SHA-256 hash using the authenticated signer's private RSA key.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSignDocument}
                    disabled={signing}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PenTool className={`w-3.5 h-3.5 ${signing ? 'animate-pulse' : ''}`} />
                    <span>{signing ? 'Signing with RSA...' : 'Sign Document'}</span>
                  </button>

                  <button
                    onClick={handleVerifySignature}
                    disabled={verifyingSig || !activeSignature}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#243B6B] bg-white hover:bg-[#F5F7FB] border border-[#C8DBFA] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title={!activeSignature ? 'Document must be signed before verifying' : 'Recalculates document hash and verifies signature'}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 text-[#15966A] ${verifyingSig ? 'animate-spin' : ''}`} />
                    <span>{verifyingSig ? 'Verifying...' : 'Verify Signature'}</span>
                  </button>
                </div>
              </div>

              {/* Verification Result Display */}
              {sigVerificationResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    sigVerificationResult.status === 'VALID' && sigVerificationResult.isMatch
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-sm">
                    {sigVerificationResult.status === 'VALID' && sigVerificationResult.isMatch ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Signature Verified</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Signature Invalid</span>
                      </>
                    )}
                  </div>

                  <p className="leading-relaxed font-medium">
                    {sigVerificationResult.status === 'VALID' && sigVerificationResult.isMatch
                      ? 'The document matches the signed version and the signature is valid.'
                      : 'Verification failed or the document no longer matches the signed version.'}
                  </p>

                  <div className="pt-2 border-t border-current/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="opacity-75 block text-[10px]">Verified Signer:</span>
                      <span className="font-semibold">{sigVerificationResult.signerName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="opacity-75 block text-[10px]">Public Key Fingerprint:</span>
                      <span className="font-semibold break-all">{sigVerificationResult.publicKeyFingerprint || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Signature Details Section */}
              {activeSignature ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#243B6B] flex items-center gap-1.5 text-xs">
                      <Key className="w-3.5 h-3.5 text-[#4776D0]" />
                      <span>Document Signature Details (Version {activeSignature.versionNumber})</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {activeSignature.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Authorized Signer</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {activeSignature.signerName} ({activeSignature.signerEmail})
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Signing Timestamp</span>
                      <span className="font-mono text-slate-800 mt-0.5 block">
                        {new Date(activeSignature.signedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Cryptographic Algorithm</span>
                      <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                        {activeSignature.algorithm}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-medium">Signer Public Key Fingerprint</span>
                      <span className="font-mono text-[10px] text-[#243B6B] font-bold mt-0.5 block truncate" title={activeSignature.publicKeyFingerprint}>
                        {activeSignature.publicKeyFingerprint}
                      </span>
                    </div>
                  </div>

                  {/* Digital Signature Base64 Value */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">Cryptographic Signature Value (Base64)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeSignature.signatureValue);
                          setCopiedSig(true);
                          setTimeout(() => setCopiedSig(false), 2000);
                        }}
                        className="text-[10px] text-[#243B6B] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedSig ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSig ? 'Copied' : 'Copy Signature'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[10px] break-all text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 select-all max-h-16 overflow-y-auto">
                      {activeSignature.signatureValue}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <PenTool className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">Document Currently Unsigned</p>
                  <p className="text-slate-500 text-[11px] mt-1 max-w-sm mx-auto">
                    Click <strong>Sign Document</strong> above to generate an RSA-2048 digital signature. Private keys are securely protected and never exposed.
                  </p>
                </div>
              )}

              {/* Version History & Document Modification / Editing Section */}
              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#243B6B] text-xs block">
                      Document Version History ({versions.length} versions)
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      When a document is edited, previous signatures are preserved and a new version is created.
                    </span>
                  </div>

                  <button
                    onClick={() => setShowVersionUpload(!showVersionUpload)}
                    className="px-2.5 py-1 text-xs font-semibold text-[#243B6B] bg-white hover:bg-[#EEF4FC] border border-[#E2E8F0] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#4776D0]" />
                    <span>{showVersionUpload ? 'Cancel' : 'Upload New Version'}</span>
                  </button>
                </div>

                {/* Upload New Version Form */}
                {showVersionUpload && (
                  <form onSubmit={handleUploadNewVersion} className="p-3.5 bg-white rounded-lg border border-[#E2E8F0] space-y-3">
                    <div className="font-semibold text-[#172033] text-xs">Create New Document Version</div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] mb-1">Select Updated File</label>
                      <input
                        type="file"
                        required
                        onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#EEF4FC] file:text-[#243B6B] file:font-semibold cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] mb-1">Change Summary / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g., Updated section 4, amended terms"
                        value={versionSummary}
                        onChange={(e) => setVersionSummary(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4776D0]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowVersionUpload(false)}
                        className="px-3 py-1 text-xs text-[#64748B] hover:bg-[#F5F7FB] rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingVersion || !versionFile}
                        className="px-3 py-1 text-xs font-bold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingVersion ? 'Creating Version...' : 'Create Version'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Version List */}
                <div className="divide-y divide-[#E2E8F0] bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                  {versions.map((ver) => (
                    <div key={ver.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#243B6B] bg-[#EEF4FC] px-1.5 py-0.2 rounded">
                            v{ver.versionNumber}
                          </span>
                          <span className="font-semibold text-[#172033]">{ver.originalFilename}</span>
                          {ver.isSigned ? (
                            <span className="text-[10px] text-[#15966A] bg-[#ECFDF5] border border-[#A7F3D0] px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Signed
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#64748B] bg-[#F5F7FB] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                              Unsigned
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">
                          {ver.changeSummary} • by {ver.createdBy} • {new Date(ver.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-[#64748B]">
                        {ver.sha256Hash.substring(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENT AUDIT TRAIL & HASH CHAIN */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              {/* Audit Header Bar & Chain Verification */}
              <div className="bg-[#EEF4FC] p-4 rounded-xl border border-[#C8DBFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#243B6B] text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-[#4776D0]" />
                    <span>Cryptographic Audit Ledger &amp; Hash Chain</span>
                  </div>
                  <p className="text-[#64748B] text-[11px] mt-0.5">
                    Records every lifecycle event (upload, view, download, sign, verify, edit, delete, share) in a tamper-evident linked chain.
                  </p>
                </div>

                <button
                  onClick={handleVerifyAuditChain}
                  disabled={verifyingChain}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Link2 className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
                  <span>{verifyingChain ? 'Verifying Chain...' : 'Verify Hash Chain'}</span>
                </button>
              </div>

              {/* Chain Verification Result Card */}
              {chainResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    chainResult.isValid
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {chainResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15966A] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    )}
                    <span>
                      {chainResult.isValid
                        ? `Chain Verified: All ${chainResult.chainLength} audit records mathematically link to genesis block.`
                        : `Chain Broken: ${chainResult.error || 'Tampering detected in audit blocks.'}`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {new Date().toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Limitation Notice */}
              <div className="p-3 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#64748B] text-[11px] leading-relaxed">
                <strong>Cryptographic Notice:</strong> TraceLock employs a backward-referencing SHA-256 hash chain where each block includes a digest of predecessor record contents.
              </div>

              {/* Audit Event Records List */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden divide-y divide-[#E2E8F0]">
                {loadingAudit ? (
                  <div className="p-8 text-center text-[#64748B]">Loading audit records...</div>
                ) : auditRecords.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B]">No audit records recorded yet.</div>
                ) : (
                  auditRecords.map((rec, index) => (
                    <div key={rec.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">#{index + 1}</span>
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                              rec.action === 'DOCUMENT_SIGNED'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : rec.action === 'SIGNATURE_VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.action === 'SIGNATURE_VERIFICATION_FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : rec.action === 'DOCUMENT_VERSION_CREATED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {rec.action}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              rec.outcome === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {rec.outcome}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {new Date(rec.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <p className="text-slate-800 text-[11px]">{rec.details}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1">
                        <div>
                          <span>Actor: </span>
                          <span className="text-slate-600 font-medium">{rec.actorName} ({rec.actorId})</span>
                          <span className="mx-1">•</span>
                          <span>IP: {rec.ipAddress}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span title={`Previous Block: ${rec.previousHash}`}>
                            Prev: {rec.previousHash.substring(0, 8)}...
                          </span>
                          <span>→</span>
                          <span className="text-[#243B6B] font-bold" title={`Record Hash: ${rec.recordHash}`}>
                            Hash: {rec.recordHash.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'signature' ? (
              <button
                onClick={handleVerifySignature}
                disabled={verifyingSig || !activeSignature}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${verifyingSig ? 'animate-spin' : ''}`} />
                <span>{verifyingSig ? 'Verifying Signature...' : 'Verify Signature'}</span>
              </button>
            ) : (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                <span>{verifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
