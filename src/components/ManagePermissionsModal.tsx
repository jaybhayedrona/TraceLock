import { useState } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { DocumentItem, FamilyMember, DocumentPermissionLevel } from '../types';
import { updateDocumentPermissions } from '../api';

interface ManagePermissionsModalProps {
  document: DocumentItem;
  members: FamilyMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagePermissionsModal({
  document,
  members,
  onClose,
  onSuccess,
}: ManagePermissionsModalProps) {
  // Existing permissions state
  const [permissions, setPermissions] = useState<
    { userId: string; permission: DocumentPermissionLevel }[]
  >(() => {
    return (
      document.permissions?.map((p) => ({
        userId: p.userId,
        permission: p.permission,
      })) || []
    );
  });

  const [selectedNewMemberId, setSelectedNewMemberId] = useState('');
  const [selectedNewPermission, setSelectedNewPermission] = useState<DocumentPermissionLevel>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available members to add (not already having permissions and not self)
  const availableMembers = members.filter(
    (m) => !permissions.some((p) => p.userId === m.id) && !m.isSelf
  );

  const handleAddMember = () => {
    if (!selectedNewMemberId) return;
    setPermissions((prev) => [
      ...prev,
      { userId: selectedNewMemberId, permission: selectedNewPermission },
    ]);
    setSelectedNewMemberId('');
  };

  const handleUpdatePermissionLevel = (userId: string, level: DocumentPermissionLevel) => {
    setPermissions((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, permission: level } : p))
    );
  };

  const handleRemovePermission = (userId: string) => {
    setPermissions((prev) => prev.filter((p) => p.userId !== userId));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateDocumentPermissions(document.id, permissions);
      setSuccess('Permissions successfully updated.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update document permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#243B6B] text-white flex items-center justify-between shrink-0 border-b border-[#1E3159]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4776D0]" />
            <h2 className="text-base font-bold">Document Access Permissions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[#15966A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15966A] shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Document Header Info */}
          <div className="p-3.5 bg-[#F5F7FB] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="font-semibold text-[#172033] text-sm truncate">
                {document.originalFilename}
              </div>
              <div className="text-[11px] text-[#64748B] font-mono mt-0.5 truncate">
                SHA-256: {document.sha256Baseline.slice(0, 16)}...
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#4776D0]/10 text-[#243B6B] font-bold text-[10px] uppercase shrink-0">
              {document.category}
            </span>
          </div>

          {/* Active Members Permission List */}
          <div>
            <div className="font-semibold text-[#172033] mb-2 flex items-center justify-between">
              <span>Members with Access ({permissions.length})</span>
              <span className="text-[11px] text-[#64748B] font-normal">
                Owner retains root administrator authority
              </span>
            </div>

            {permissions.length === 0 ? (
              <div className="p-4 text-center text-[#64748B] bg-slate-50 rounded-lg border border-dashed border-[#E2E8F0]">
                No family members currently assigned. Only document owner can view.
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((p) => {
                  const m = members.find((mem) => mem.id === p.userId);
                  if (!m) return null;

                  return (
                    <div
                      key={p.userId}
                      className="p-3 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#243B6B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            m.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#172033] truncate">{m.name}</div>
                          <div className="text-[11px] text-[#64748B] truncate">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={p.permission}
                          onChange={(e) =>
                            handleUpdatePermissionLevel(
                              p.userId,
                              e.target.value as DocumentPermissionLevel
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-slate-50 font-semibold text-[#172033] text-[11px] focus:outline-none focus:border-[#4776D0]"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemovePermission(p.userId)}
                          className="p-1.5 text-slate-400 hover:text-[#DC2626] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Member Section */}
          {availableMembers.length > 0 && (
            <div className="pt-2 border-t border-[#E2E8F0]">
              <label className="block font-semibold text-[#172033] mb-1.5">
                Grant Access to Another Member
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedNewMemberId}
                  onChange={(e) => setSelectedNewMemberId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-medium text-[#172033] focus:outline-none focus:border-[#4776D0]"
                >
                  <option value="">-- Choose member to add --</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedNewPermission}
                  onChange={(e) =>
                    setSelectedNewPermission(e.target.value as DocumentPermissionLevel)
                  }
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white font-medium text-[#172033] focus:outline-none focus:border-[#4776D0]"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedNewMemberId}
                  className="px-3.5 py-2 bg-[#4776D0] text-white rounded-lg font-semibold hover:bg-[#3460B8] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 bg-[#243B6B] hover:bg-[#1A2C52] text-white rounded-lg font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Apply Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
