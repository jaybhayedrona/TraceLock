import { useState } from 'react';
import {
  FileText,
  Search,
  Upload,
  RefreshCw,
  Download,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle2,
  Lock,
  PenTool,
  History,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  File,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  DocumentItem,
  DocumentCategory,
} from '../types';
import { DocumentDetailsModal } from './DocumentDetailsModal';
import { DuplicateDocumentModal, DuplicateModalData } from './DuplicateDocumentModal';
import {
  verifyDocument,
  verifyAllDocuments,
  toggleMonitoring,
  deleteDocument,
  downloadDocument,
  uploadDocument,
} from '../api';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onRefresh: () => Promise<void>;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
}

export function DocumentsView({
  documents,
  onRefresh,
  isUploadOpen,
  setIsUploadOpen,
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Inspection & Local Viewer modal state
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'preview' | 'crypto' | 'signature' | 'audit'>('preview');
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload modal state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Educational');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<DuplicateModalData | null>(null);

  // Action loading states
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'MONITORED' && doc.monitoringStatus === 'MONITORED') ||
      (selectedStatus === 'PAUSED' && doc.monitoringStatus === 'PAUSED') ||
      (selectedStatus === 'MISMATCH' && doc.verificationStatus === 'MISMATCH_DETECTED');
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleVerify = async (doc: DocumentItem) => {
    setVerifyingId(doc.id);
    setActionMessage(null);
    try {
      const res = await verifyDocument(doc.id);
      await onRefresh();
      if (res.isMatch) {
        setActionMessage({
          type: 'success',
          text: `Integrity confirmed for "${doc.originalFilename}": Cryptographic SHA-256 byte digest matches reference baseline.`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `CRITICAL INTEGRITY MISMATCH detected for "${doc.originalFilename}"! Security alert generated.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Verification failed. Stored file could not be verified.',
      });
      await onRefresh();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyAll = async () => {
    setBulkVerifying(true);
    setActionMessage(null);
    try {
      await verifyAllDocuments();
      await onRefresh();
      setActionMessage({
        type: 'success',
        text: 'Bulk integrity verification complete across all monitored documents.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Bulk verification encountered an issue.',
      });
    } finally {
      setBulkVerifying(false);
    }
  };

  const handleToggleMonitoring = async (doc: DocumentItem) => {
    try {
      await toggleMonitoring(doc.id);
      await onRefresh();
      setActionMessage({
        type: 'success',
        text: `Monitoring ${doc.monitoringStatus === 'MONITORED' ? 'paused' : 'resumed'} for "${doc.originalFilename}".`,
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  const handleDelete = (doc: DocumentItem) => {
    setDocToDelete(doc);
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDocument(docToDelete.id);
      await onRefresh();
      setActionMessage({
        type: 'success',
        text: `Document "${docToDelete.originalFilename}" deleted successfully.`,
      });
      if (inspectDoc?.id === docToDelete.id) setInspectDoc(null);
      setDocToDelete(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete document' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await downloadDocument(doc.id, doc.originalFilename);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Download failed. Ensure you have permission to download.',
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds maximum allowed boundary of 10MB.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadProgress(25);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', uploadCategory);
    if (uploadExpiry) formData.append('expiryDate', uploadExpiry);

    try {
      setUploadProgress(65);
      await uploadDocument(formData);
      setUploadProgress(100);
      await onRefresh();
      setIsUploadOpen(false);
      const uploadedName = uploadFile.name;
      setUploadFile(null);
      setUploadExpiry('');
      setActionMessage({
        type: 'success',
        text: `Document "${uploadedName}" registered with cryptographic SHA-256 baseline.`,
      });
    } catch (err: any) {
      if (err.isDuplicate && err.existingDocument) {
        setIsUploadOpen(false);
        setDuplicateData({
          file: uploadFile,
          category: uploadCategory,
          expiryDate: uploadExpiry || undefined,
          existingDocument: err.existingDocument,
        });
        return;
      }
      setUploadError(err.message || 'Upload processing failed.');
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  const handleProceedDuplicate = async () => {
    if (!duplicateData) return;
    const formData = new FormData();
    formData.append('file', duplicateData.file);
    formData.append('category', duplicateData.category);
    if (duplicateData.expiryDate) {
      formData.append('expiryDate', duplicateData.expiryDate);
    }
    formData.append('allowDuplicate', 'true');

    try {
      await uploadDocument(formData);
      await onRefresh();
      const fileName = duplicateData.file.name;
      setDuplicateData(null);
      setUploadFile(null);
      setUploadExpiry('');
      setActionMessage({
        type: 'success',
        text: `Duplicate document "${fileName}" uploaded and enrolled as an independent baseline.`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to upload duplicate document.',
      });
      setDuplicateData(null);
    }
  };

  const handleCancelDuplicate = () => {
    const fileName = duplicateData?.file.name;
    setDuplicateData(null);
    setUploadFile(null);
    setUploadExpiry('');
    setActionMessage({
      type: 'success',
      text: fileName
        ? `Upload of duplicate document "${fileName}" was cancelled. Vault remains unchanged.`
        : 'Upload cancelled.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            Document Library
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Cryptographic storage repository, NIST SHA-256 baseline invariants, and active monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerifyAll}
            disabled={bulkVerifying}
            className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white hover:bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4776D0] ${bulkVerifying ? 'animate-spin' : ''}`} />
            <span>{bulkVerifying ? 'Verifying All...' : 'Verify All Baselines'}</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15966A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-[#4776D0] transition-all placeholder:text-[#64748B]"
          />
        </div>

        {/* Category & Status Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] text-xs focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
          >
            <option value="ALL">All Categories</option>
            <option value="Educational">Educational</option>
            <option value="Identity">Identity</option>
            <option value="Financial">Financial</option>
            <option value="Employment">Employment</option>
            <option value="Legal">Legal</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] text-xs focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
          >
            <option value="ALL">All Statuses</option>
            <option value="MONITORED">Monitored Only</option>
            <option value="MISMATCH">Mismatches Only</option>
            <option value="PAUSED">Paused Only</option>
          </select>
        </div>
      </div>

      {/* 4. Documents Data Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
            <p className="font-semibold text-[#172033]">No documents found.</p>
            <p className="mt-1">Try adjusting your search criteria or upload a new document to the vault.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F7FB] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4">Digital Signature</th>
                  <th className="py-3.5 px-4">Last Verified</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredDocs.map((doc) => {
                  const typeInfo = getFileTypeInfo(doc.originalFilename, doc.mimeType);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-[#F5F7FB]/70 transition-colors">
                      {/* Document Name with File Type Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${typeInfo.colorClass}`}>
                            <TypeIcon className={`w-4 h-4 ${typeInfo.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setInspectDoc(doc)}
                              className="font-semibold text-[#172033] hover:text-[#243B6B] hover:underline cursor-pointer truncate max-w-xs block text-left"
                              title={doc.originalFilename}
                            >
                              {doc.originalFilename}
                            </button>
                            <div className="font-mono text-[10px] text-[#64748B] mt-0.5">
                              ID: {doc.id} · v{doc.versionNumber || 1}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-[#172033]">
                        <span className="font-medium">{doc.category}</span>
                        {doc.expiryDate && (
                          <div className="text-[10px] text-[#D97706] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>Exp: {doc.expiryDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#64748B]">
                        {Math.round(doc.fileSize / 1024)} KB
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0]'
                              : doc.verificationStatus === 'MISMATCH_DETECTED'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-bold'
                              : doc.verificationStatus === 'FAILED'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                          }`}
                        >
                          {doc.verificationStatus === 'VERIFIED' && <ShieldCheck className="w-3.5 h-3.5 text-[#15966A]" />}
                          {doc.verificationStatus === 'MISMATCH_DETECTED' && <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />}
                          {doc.verificationStatus === 'FAILED' && <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />}
                          {doc.verificationStatus === 'DISABLED' && <Shield className="w-3.5 h-3.5 text-[#64748B]" />}
                          <span>
                            {doc.verificationStatus === 'VERIFIED'
                              ? 'Verified'
                              : doc.verificationStatus === 'MISMATCH_DETECTED'
                              ? 'MISMATCH'
                              : doc.verificationStatus === 'FAILED'
                              ? 'Verification Failed'
                              : doc.verificationStatus === 'DISABLED'
                              ? 'Paused'
                              : 'Pending'}
                          </span>
                        </span>
                      </td>

                      {/* Digital Signature */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setInspectDoc(doc);
                            setModalInitialTab('signature');
                          }}
                          className="cursor-pointer text-left"
                          title="Click to view digital signature"
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                              doc.signatureStatus === 'SIGNED'
                                ? 'bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0] hover:bg-[#D1FAE5]'
                                : doc.signatureStatus === 'INVALID'
                                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]'
                                : 'bg-[#F5F7FB] text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0]'
                            }`}
                          >
                            <PenTool className="w-3 h-3 text-[#4776D0]" />
                            <span>
                              {doc.signatureStatus === 'SIGNED'
                                ? 'Signed (RSA)'
                                : doc.signatureStatus === 'INVALID'
                                ? 'Invalid Sig'
                                : 'Unsigned'}
                            </span>
                          </span>
                        </button>
                      </td>

                      {/* Last Verified */}
                      <td className="py-3.5 px-4 text-[#64748B] font-mono text-[11px] tabular-nums">
                        {doc.lastVerificationTime ? (
                          <div>
                            <div className="text-[#172033]">{new Date(doc.lastVerificationTime).toLocaleDateString()}</div>
                            <div className="text-[10px] text-[#64748B]">
                              {new Date(doc.lastVerificationTime).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* 1. View Document Content Locally */}
                          <button
                            onClick={() => {
                              setInspectDoc(doc);
                              setModalInitialTab('preview');
                            }}
                            title="View document content locally in browser"
                            className="px-2.5 py-1 text-xs font-semibold text-[#243B6B] bg-[#EEF4FC] hover:bg-[#EEF4FC]/80 border border-[#C8DBFA] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#4776D0]" />
                            <span>View</span>
                          </button>

                          {/* 2. Run Verification */}
                          <button
                            onClick={() => handleVerify(doc)}
                            disabled={verifyingId === doc.id}
                            title="Verify cryptographic SHA-256 integrity"
                            className="p-1.5 text-[#64748B] hover:text-[#243B6B] hover:bg-[#F5F7FB] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === doc.id ? 'animate-spin text-[#15966A]' : ''}`} />
                          </button>

                          {/* 3. Inspect Cryptographic Baseline */}
                          <button
                            onClick={() => {
                              setInspectDoc(doc);
                              setModalInitialTab('crypto');
                            }}
                            title="Inspect cryptographic SHA-256 baseline"
                            className="p-1.5 text-[#64748B] hover:text-[#243B6B] hover:bg-[#F5F7FB] rounded-lg transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Download */}
                          <button
                            onClick={() => handleDownload(doc)}
                            title="Download document safely"
                            className="p-1.5 text-[#64748B] hover:text-[#243B6B] hover:bg-[#F5F7FB] rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Toggle Monitoring */}
                          <button
                            onClick={() => handleToggleMonitoring(doc)}
                            title={doc.monitoringStatus === 'MONITORED' ? 'Pause monitoring' : 'Resume monitoring'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              doc.monitoringStatus === 'MONITORED'
                                ? 'text-[#15966A] hover:bg-[#ECFDF5]'
                                : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Delete */}
                          <button
                            onClick={() => handleDelete(doc)}
                            title="Delete document"
                            className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* DOCUMENT LOCAL VIEWER & CRYPTOGRAPHIC DETAILS MODAL */}
      <DocumentDetailsModal
        document={inspectDoc}
        initialTab={modalInitialTab}
        onClose={() => setInspectDoc(null)}
        onRefresh={onRefresh}
      />

      {/* UPLOAD DOCUMENT MODAL WITH PROGRESS INDICATOR */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#EEF4FC]" />
                <h2 className="text-sm font-bold">Register Document Baseline</h2>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-white/70 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File selector / Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Select Document File (Max 10MB)
                </label>
                <div className="border-2 border-dashed border-[#E2E8F0] hover:border-[#4776D0] rounded-xl p-4 text-center bg-[#F5F7FB] transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-[#64748B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EEF4FC] file:text-[#243B6B] hover:file:bg-[#EEF4FC]/80 cursor-pointer"
                  />
                  {uploadFile && (
                    <div className="mt-2 text-left p-2 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
                      <span className="font-semibold text-[#172033] truncate">{uploadFile.name}</span>
                      <span className="font-mono text-[10px] text-[#64748B] shrink-0">
                        {Math.round(uploadFile.size / 1024)} KB
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  Supported formats: PDF, Word (DOCX), Excel, Text (TXT), Images (PNG, JPG).
                </p>
              </div>

              {/* Progress Indicator when uploading */}
              {uploadLoading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#243B6B]">
                    <span>Computing SHA-256 byte digest &amp; encrypting...</span>
                    <span className="font-mono tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5F7FB] rounded-full overflow-hidden border border-[#E2E8F0]">
                    <div
                      className="h-full bg-gradient-to-r from-[#243B6B] to-[#4776D0] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Document Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full py-2 px-3 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                >
                  <option value="Educational">Educational (Mark Sheets, Degrees)</option>
                  <option value="Identity">Identity (Passport, National ID)</option>
                  <option value="Financial">Financial (Tax Records, Bank Receipts)</option>
                  <option value="Employment">Employment (Offer Letters, NDAs)</option>
                  <option value="Legal">Legal (Contracts, Deeds)</option>
                  <option value="Other">Other Important Documents</option>
                </select>
              </div>

              {/* Expiry Date (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={uploadExpiry}
                  onChange={(e) => setUploadExpiry(e.target.value)}
                  className="w-full py-2 px-3 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  TraceLock will track this expiry date and send reminder alerts.
                </p>
              </div>

              {/* Security info box */}
              <div className="p-3 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0] text-[#64748B] text-[11px] leading-relaxed">
                Upon upload, TraceLock stores the file in secure private storage (outside public root) and registers an immutable <strong>NIST SHA-256 reference baseline</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] bg-[#F5F7FB] hover:bg-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploadLoading ? 'Computing Baseline...' : 'Register & Monitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#DC2626] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold">Delete Document</h2>
              </div>
              <button
                onClick={() => setDocToDelete(null)}
                className="text-white/70 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#172033] leading-relaxed">
                Are you sure you want to permanently delete <strong>"{docToDelete.originalFilename}"</strong>?
              </p>
              <p className="text-[#64748B] text-[11px] leading-relaxed">
                This will remove the file from secure physical storage and delete its registered cryptographic SHA-256 baseline and integrity records. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDocToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] bg-[#F5F7FB] hover:bg-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE DOCUMENT DETECTION MODAL */}
      {duplicateData && (
        <DuplicateDocumentModal
          data={duplicateData}
          onProceedAnyway={handleProceedDuplicate}
          onCancelUpload={handleCancelDuplicate}
        />
      )}
    </div>
  );
}
