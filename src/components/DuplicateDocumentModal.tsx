import { useState } from 'react';
import {
  Copy,
  AlertTriangle,
  FileCheck,
  Calendar,
  HardDrive,
  Hash,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { DocumentCategory } from '../types';

export interface DuplicateModalData {
  file: File;
  category: DocumentCategory;
  expiryDate?: string;
  existingDocument: {
    id: string;
    originalFilename: string;
    createdAt: string;
    fileSize: number;
    category?: string;
    sha256Baseline: string;
  };
}

interface DuplicateDocumentModalProps {
  data: DuplicateModalData;
  onProceedAnyway: () => Promise<void>;
  onCancelUpload: () => void;
}

export function DuplicateDocumentModal({
  data,
  onProceedAnyway,
  onCancelUpload,
}: DuplicateDocumentModalProps) {
  const [isProceeding, setIsProceeding] = useState(false);

  const handleProceed = async () => {
    setIsProceeding(true);
    try {
      await onProceedAnyway();
    } finally {
      setIsProceeding(false);
    }
  };

  const formattedUploadDate = new Date(data.existingDocument.createdAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const existingSizeKb = (data.existingDocument.fileSize / 1024).toFixed(1);
  const newSizeKb = (data.file.size / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2E8F0] overflow-hidden my-6">
        {/* Modal Header in Deep Indigo #243B6B */}
        <div className="bg-[#243B6B] text-white px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
              <Copy className="w-5 h-5 text-[#4776D0]" />
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase bg-white/15 text-[#EEF4FC] px-2 py-0.5 rounded-full font-bold">
                Deduplication Sentinel
              </span>
              <h2 className="text-base font-bold text-white mt-0.5 leading-tight">
                Duplicate Document Detected
              </h2>
            </div>
          </div>
          <button
            onClick={onCancelUpload}
            disabled={isProceeding}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Main Question Notice in Warning Amber #D97706 */}
          <div className="p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] text-[#92400E] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#172033] text-sm">
                  This exact file already exists in your vault. Do you want to upload it anyway?
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  TraceLock computed the cryptographic SHA-256 byte digest and identified an identical file already stored in your private vault.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Existing vs New File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Existing File Details */}
            <div className="p-3.5 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <span>Existing In Vault</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-[#172033] border border-[#E2E8F0] text-[9px] font-semibold">
                  Stored
                </span>
              </div>
              <div>
                <div className="font-bold text-[#172033] truncate" title={data.existingDocument.originalFilename}>
                  {data.existingDocument.originalFilename}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-[#64748B]" />
                  <span>{existingSizeKb} KB</span>
                  {data.existingDocument.category && (
                    <span>· {data.existingDocument.category}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-[#172033]">
                  <Calendar className="w-3.5 h-3.5 text-[#243B6B]" />
                  <span>Uploaded:</span>
                </div>
                <div className="font-semibold text-[#172033] pl-5">
                  {formattedUploadDate}
                </div>
              </div>
            </div>

            {/* New File to Upload */}
            <div className="p-3.5 bg-[#EEF4FC] rounded-xl border border-[#C8DBFA] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#243B6B] uppercase tracking-wider">
                <span>Attempted Upload</span>
                <span className="px-1.5 py-0.5 rounded bg-[#243B6B] text-white text-[9px] font-semibold">
                  New
                </span>
              </div>
              <div>
                <div className="font-bold text-[#172033] truncate" title={data.file.name}>
                  {data.file.name}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#4776D0]" />
                  <span>{newSizeKb} KB</span>
                  <span>· {data.category}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#C8DBFA] text-[11px] text-[#64748B] space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-[#15966A]">
                  <FileCheck className="w-3.5 h-3.5 text-[#15966A]" />
                  <span>Payload Integrity:</span>
                </div>
                <div className="font-semibold text-[#15966A] pl-5 text-[11px]">
                  100% Identical byte payload
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="p-3 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] font-mono text-[10px] text-[#64748B] flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-[#243B6B] shrink-0" />
            <span className="truncate">
              SHA-256: <strong className="text-[#172033]">{data.existingDocument.sha256Baseline}</strong>
            </span>
          </div>

          <p className="text-[11px] text-[#64748B] leading-relaxed">
            If you choose <strong>"Proceed Anyway"</strong>, the file will be saved as an independent entry with its own integrity baseline. If you select <strong>"Cancel Upload"</strong>, the upload will be stopped without storing extra bytes.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isProceeding}
              onClick={onCancelUpload}
              className="px-4 py-2 border border-[#E2E8F0] hover:bg-[#F5F7FB] text-[#172033] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel Upload
            </button>

            <button
              type="button"
              disabled={isProceeding}
              onClick={handleProceed}
              className="px-4 py-2 bg-[#243B6B] hover:bg-[#1D315B] text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isProceeding ? 'Uploading...' : 'Proceed Anyway'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#EEF4FC]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
