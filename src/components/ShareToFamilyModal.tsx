import { useState } from 'react';
import {
  X,
  Share2,
  Users,
  Shield,
  Calendar,
  Bell,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { DocumentItem, FamilyMember, DocumentPermissionLevel } from '../types';
import { shareDocumentToFamily } from '../api';

interface ShareToFamilyModalProps {
  documents: DocumentItem[];
  preselectedDocId?: string;
  members: FamilyMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareToFamilyModal({
  documents,
  preselectedDocId,
  members,
  onClose,
  onSuccess,
}: ShareToFamilyModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    preselectedDocId || documents[0]?.id || ''
  );
  const [memberPermissions, setMemberPermissions] = useState<
    Record<string, { selected: boolean; permission: DocumentPermissionLevel }>
  >(() => {
    const map: Record<string, { selected: boolean; permission: DocumentPermissionLevel }> = {};
    members.forEach((m) => {
      // By default select other active members as Viewer
      if (!m.isSelf) {
        map[m.id] = { selected: true, permission: m.familyRole === 'Editor' ? 'EDITOR' : 'VIEWER' };
      }
    });
    return map;
  });

  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [reminderDays, setReminderDays] = useState<number[]>([30, 14, 7]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const toggleMember = (memberId: string) => {
    setMemberPermissions((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        selected: !prev[memberId]?.selected,
        permission: prev[memberId]?.permission || 'VIEWER',
      },
    }));
  };

  const updatePermission = (memberId: string, permission: DocumentPermissionLevel) => {
    setMemberPermissions((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        permission,
      },
    }));
  };

  const handleToggleReminderDay = (day: number) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) {
      setError('Please select a document to share.');
      return;
    }

    const assignedPermissions = Object.entries(memberPermissions)
      .filter(([_, val]) => val.selected)
      .map(([userId, val]) => ({
        userId,
        permission: val.permission,
      }));

    if (assignedPermissions.length === 0) {
      setError('Please select at least one family member to grant access to.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await shareDocumentToFamily(
        selectedDocId,
        assignedPermissions,
        hasExpiry ? expiryDate : undefined,
        hasExpiry ? reminderDays : undefined
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to share document to Family Vault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#243B6B] text-white flex items-center justify-between shrink-0 border-b border-[#1E3159]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#4776D0]" />
            <h2 className="text-base font-bold">Share to Family Vault</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Selection */}
          <div>
            <label className="block font-semibold text-[#172033] mb-1.5">Select Document</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={!!preselectedDocId}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white font-medium text-[#172033] focus:outline-none focus:border-[#4776D0] focus:ring-1 focus:ring-[#4776D0]"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.originalFilename} ({doc.category})
                </option>
              ))}
            </select>
            {selectedDoc && (
              <div className="mt-2 p-2.5 bg-[#F5F7FB] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <FileText className="w-3.5 h-3.5 text-[#243B6B]" />
                  <span>SHA-256: {selectedDoc.sha256Baseline.slice(0, 16)}...</span>
                </span>
                <span className="font-semibold text-[#243B6B] uppercase">
                  v{selectedDoc.versionNumber || 1}
                </span>
              </div>
            )}
          </div>

          {/* Member Selection & Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[#172033] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#243B6B]" />
                <span>Select Family Members & Permissions</span>
              </label>
              <span className="text-[11px] text-[#64748B]">Granular access control</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {members
                .filter((m) => !m.isSelf)
                .map((member) => {
                  const state = memberPermissions[member.id] || {
                    selected: false,
                    permission: 'VIEWER',
                  };

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        state.selected
                          ? 'border-[#4776D0]/40 bg-[#4776D0]/10'
                          : 'border-[#E2E8F0] hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={() => toggleMember(member.id)}
                          className="rounded text-[#243B6B] focus:ring-[#4776D0] w-4 h-4 cursor-pointer accent-[#243B6B]"
                        />
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#243B6B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#172033] truncate">{member.name}</div>
                          <div className="text-[11px] text-[#64748B] font-mono truncate">
                            {member.email} · {member.familyRole}
                          </div>
                        </div>
                      </label>

                      {state.selected && (
                        <select
                          value={state.permission}
                          onChange={(e) =>
                            updatePermission(
                              member.id,
                              e.target.value as DocumentPermissionLevel
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white font-semibold text-[#172033] text-[11px] focus:outline-none focus:border-[#4776D0]"
                        >
                          <option value="VIEWER">Viewer (Read/Download)</option>
                          <option value="EDITOR">Editor (Can Upload Versions)</option>
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Expiry Date & Reminders (Optional) */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#172033] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded text-[#243B6B] focus:ring-[#4776D0] w-4 h-4 cursor-pointer accent-[#243B6B]"
                />
                <Calendar className="w-3.5 h-3.5 text-[#243B6B]" />
                <span>Configure Expiry Date & Reminders</span>
              </label>
              <span className="text-[10px] text-[#64748B]">
                Insurance, ID, Warranties
              </span>
            </div>

            {hasExpiry && (
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] text-xs focus:outline-none focus:border-[#4776D0]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1.5 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-[#4776D0]" />
                    <span>Send Notification Reminders Before Expiry</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[30, 14, 7, 1].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleReminderDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          reminderDays.includes(day)
                            ? 'bg-[#243B6B] text-white'
                            : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-slate-100'
                        }`}
                      >
                        {day} days before
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#15966A] shrink-0" />
            <span>
              Unselected personal documents remain strictly private in your Personal Vault.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#243B6B] hover:bg-[#1A2C52] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Sharing...' : 'Confirm Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
