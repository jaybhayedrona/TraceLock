import { useState } from 'react';
import {
  Share2,
  Plus,
  Copy,
  Check,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DocumentItem, SharedDocument } from '../types';
import { createSharedDocument, revokeSharedDocument } from '../api';

interface SharedDocumentsViewProps {
  documents: DocumentItem[];
  sharedDocuments: SharedDocument[];
  onRefresh: () => Promise<void>;
}

export function SharedDocumentsView({
  documents,
  sharedDocuments,
  onRefresh,
}: SharedDocumentsViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shareToRevoke, setShareToRevoke] = useState<{ id: string; name: string } | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) {
      setActionMessage({ type: 'error', text: 'Please select a document to share.' });
      return;
    }
    setLoading(true);
    setActionMessage(null);

    try {
      await createSharedDocument(selectedDocId, recipientEmail, permission, expiryDate);
      await onRefresh();
      setIsCreateOpen(false);
      setRecipientEmail('');
      setActionMessage({
        type: 'success',
        text: 'Secure document share link generated with expiration tracking.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to share document.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = (id: string, docName: string) => {
    setShareToRevoke({ id, name: docName });
  };

  const executeRevoke = async () => {
    if (!shareToRevoke) return;
    setRevoking(true);
    try {
      await revokeSharedDocument(shareToRevoke.id);
      await onRefresh();
      setActionMessage({
        type: 'success',
        text: `Share link for "${shareToRevoke.name}" successfully revoked.`,
      });
      setShareToRevoke(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to revoke.' });
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyLink = (shareId: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            Shared Documents
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create time-bounded, permission-controlled secure links to share your verified documents.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Share Link</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#15966A]'
              : 'bg-rose-50 border-rose-200 text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15966A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Shared Documents Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {sharedDocuments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Share2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-[#172033]">No active shared documents.</p>
            <p className="mt-1">Click "New Share Link" to safely share a document with third parties.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Permission</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Access Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sharedDocuments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#243B6B] shrink-0" />
                        <span className="font-semibold text-[#172033]">{s.documentName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#64748B]">
                      {s.sharedWithEmail}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#4776D0]/10 text-[#243B6B] border border-[#4776D0]/20">
                        {s.permission === 'VIEW' ? 'View Only' : 'Download Allowed'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#64748B] tabular-nums">
                      {s.expiresAt}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#172033] tabular-nums">
                      {s.accessCount} visits
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(s.id)}
                          className="px-2.5 py-1 text-[#243B6B] hover:text-[#4776D0] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                          title="Copy secure link"
                        >
                          {copiedId === s.id ? (
                            <Check className="w-3.5 h-3.5 text-[#15966A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === s.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleRevoke(s.id, s.documentName)}
                          className="p-1.5 text-slate-400 hover:text-[#DC2626] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SHARE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between border-b border-[#1E3159]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#4776D0]" />
                <h2 className="text-sm font-semibold tracking-wide">Generate Secure Share Link</h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-white/70 hover:text-white text-xl leading-none font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateShare} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Choose Document
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.originalFilename} ({d.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Recipient Email (Optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. evaluator@university.edu"
                  className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Permission Level
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
                  className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                >
                  <option value="VIEW">View Only (Preview in sandbox)</option>
                  <option value="DOWNLOAD">Download Allowed (Full file access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Link Expiration Date
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Generate Share Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE CONFIRMATION MODAL */}
      {shareToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#DC2626] px-6 py-4 text-white flex items-center justify-between border-b border-red-700">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-200" />
                <h2 className="text-sm font-semibold tracking-wide">Revoke Access Link</h2>
              </div>
              <button
                onClick={() => setShareToRevoke(null)}
                className="text-white/70 hover:text-white text-xl leading-none font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#172033] leading-relaxed">
                Revoke access to <strong>"{shareToRevoke.name}"</strong>?
              </p>
              <p className="text-[#64748B] text-[11px] leading-relaxed">
                The recipient will immediately lose access to view or download this document through this link.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShareToRevoke(null)}
                  disabled={revoking}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeRevoke}
                  disabled={revoking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {revoking ? 'Revoking...' : 'Revoke Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
