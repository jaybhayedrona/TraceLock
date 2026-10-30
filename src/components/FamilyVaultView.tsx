import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Clock,
  Share2,
  Calendar,
  Trash2,
  RotateCcw,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  Camera,
  History,
  Lock,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';
import {
  User,
  DocumentItem,
  FamilyOverview,
  FamilyMember,
  FamilyInvitation,
  FamilyActivityItem,
  RecycleBinDocument,
  DocumentReminderInfo,
  DocumentPermissionLevel,
} from '../types';
import {
  getFamilyOverview,
  getFamilyMembers,
  getFamilyInvitations,
  getFamilyActivityTimeline,
  getFamilyDocuments,
  getFamilyReminders,
  getRecycleBinDocuments,
  inviteFamilyMember,
  updateFamilyMemberRole,
  removeFamilyMember,
  revokeFamilyInvitation,
  deleteFamilyDocument,
  restoreRecycleBinDocument,
  permanentlyDeleteDocument,
  emptyFamilyRecycleBin,
  unshareFamilyDocument,
  deleteDocumentExpiryReminder,
  setDocumentExpiryReminder,
  verifyDocument,
} from '../api';
import { ProfileAvatarModal } from './ProfileAvatarModal';
import { ShareToFamilyModal } from './ShareToFamilyModal';
import { ManagePermissionsModal } from './ManagePermissionsModal';

interface FamilyVaultViewProps {
  user: User;
  personalDocuments: DocumentItem[];
  onRefreshData: () => Promise<void>;
  onOpenDocDetails?: (doc: DocumentItem) => void;
  onUserUpdate?: (updatedUser: User) => void;
}

type FamilyTab = 'overview' | 'documents' | 'members' | 'timeline' | 'reminders' | 'recycle-bin';

export function FamilyVaultView({
  user,
  personalDocuments,
  onRefreshData,
  onOpenDocDetails,
  onUserUpdate,
}: FamilyVaultViewProps) {
  const [activeTab, setActiveTab] = useState<FamilyTab>('overview');

  // Core Data
  const [overview, setOverview] = useState<FamilyOverview | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [activities, setActivities] = useState<FamilyActivityItem[]>([]);
  const [familyDocs, setFamilyDocs] = useState<DocumentItem[]>([]);
  const [reminders, setReminders] = useState<DocumentReminderInfo[]>([]);
  const [recycleBinDocs, setRecycleBinDocs] = useState<RecycleBinDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Dialogs
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [permissionDoc, setPermissionDoc] = useState<DocumentItem | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Editor' | 'Viewer'>('Viewer');
  const [inviting, setInviting] = useState(false);

  // Expiry Reminder Dialog
  const [reminderDialogDoc, setReminderDialogDoc] = useState<DocumentItem | null>(null);
  const [reminderExpiryDate, setReminderExpiryDate] = useState('');
  const [reminderSelectedDays, setReminderSelectedDays] = useState<number[]>([30, 14, 7]);
  const [savingReminder, setSavingReminder] = useState(false);

  // Filters & Searches
  const [timelineFilter, setTimelineFilter] = useState('ALL');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

  // Deletion & Action Confirmation States (custom modals replacing iframe-blocked window.confirm)
  const [docToRecycle, setDocToRecycle] = useState<DocumentItem | null>(null);
  const [docToPurge, setDocToPurge] = useState<RecycleBinDocument | null>(null);
  const [isEmptyRecycleBinModalOpen, setIsEmptyRecycleBinModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<{ id: string; email: string } | null>(null);
  const [docToUnshare, setDocToUnshare] = useState<DocumentItem | null>(null);
  const [isDeletingAction, setIsDeletingAction] = useState(false);

  // Load all Family Vault state
  const loadFamilyData = useCallback(async () => {
    try {
      setLoading(true);
      const [ov, mems, invs, acts, fdocs, rems, rbin] = await Promise.all([
        getFamilyOverview().catch(() => null),
        getFamilyMembers().catch(() => []),
        getFamilyInvitations().catch(() => []),
        getFamilyActivityTimeline(timelineFilter !== 'ALL' ? timelineFilter : undefined).catch(() => []),
        getFamilyDocuments().catch(() => []),
        getFamilyReminders().catch(() => []),
        getRecycleBinDocuments().catch(() => []),
      ]);

      setOverview(ov);
      setMembers(mems);
      setInvitations(invs);
      setActivities(acts);
      setFamilyDocs(fdocs);
      setReminders(rems);
      setRecycleBinDocs(rbin);
    } catch (err: any) {
      console.error('Failed to load Family Vault data', err);
    } finally {
      setLoading(false);
    }
  }, [timelineFilter]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  // Handle member invitation
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setActionMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setInviting(true);
    setActionMessage(null);
    try {
      await inviteFamilyMember(inviteEmail, inviteRole);
      setActionMessage({
        type: 'success',
        text: `Invitation successfully sent to ${inviteEmail} with ${inviteRole} role.`,
      });
      setInviteEmail('');
      setInviteModalOpen(false);
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to invite family member.' });
    } finally {
      setInviting(false);
    }
  };

  // Handle member role change
  const handleRoleChange = async (memberId: string, newRole: 'Owner' | 'Editor' | 'Viewer') => {
    try {
      await updateFamilyMemberRole(memberId, newRole);
      setActionMessage({
        type: 'success',
        text: `Member role updated to ${newRole}.`,
      });
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update member role.' });
    }
  };

  // Handle member removal execution
  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsDeletingAction(true);
    try {
      await removeFamilyMember(memberToRemove.id);
      setActionMessage({
        type: 'success',
        text: `${memberToRemove.name} has been removed from the Family Vault.`,
      });
      setMemberToRemove(null);
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to remove member.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle invitation revocation execution
  const executeRevokeInvitation = async () => {
    if (!invitationToRevoke) return;
    setIsDeletingAction(true);
    try {
      await revokeFamilyInvitation(invitationToRevoke.id);
      setActionMessage({
        type: 'success',
        text: `Invitation for ${invitationToRevoke.email} revoked.`,
      });
      setInvitationToRevoke(null);
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to revoke invitation.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle move to Recycle Bin execution
  const executeDeleteToRecycleBin = async () => {
    if (!docToRecycle) return;
    setIsDeletingAction(true);
    try {
      await deleteFamilyDocument(docToRecycle.id);
      setActionMessage({
        type: 'success',
        text: `"${docToRecycle.originalFilename}" moved to Family Recycle Bin (30-day retention policy).`,
      });
      setDocToRecycle(null);
      await loadFamilyData();
      await onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to move document to Recycle Bin.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle restore from Recycle Bin
  const handleRestoreDoc = async (docId: string, docName: string) => {
    try {
      await restoreRecycleBinDocument(docId);
      setActionMessage({
        type: 'success',
        text: `Document "${docName}" restored successfully with SHA-256 integrity verified.`,
      });
      await loadFamilyData();
      await onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to restore document.' });
    }
  };

  // Handle permanent delete execution
  const executePermanentDelete = async () => {
    if (!docToPurge) return;
    setIsDeletingAction(true);
    try {
      await permanentlyDeleteDocument(docToPurge.id);
      setActionMessage({
        type: 'success',
        text: `Document "${docToPurge.originalFilename}" has been permanently purged.`,
      });
      setDocToPurge(null);
      await loadFamilyData();
      await onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to permanently delete document.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle empty recycle bin execution
  const executeEmptyRecycleBin = async () => {
    setIsDeletingAction(true);
    try {
      const res = await emptyFamilyRecycleBin();
      setActionMessage({
        type: 'success',
        text: res.message || 'Family Recycle Bin emptied successfully.',
      });
      setIsEmptyRecycleBinModalOpen(false);
      await loadFamilyData();
      await onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to empty Recycle Bin.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle unshare document execution
  const executeUnshareDoc = async () => {
    if (!docToUnshare) return;
    setIsDeletingAction(true);
    try {
      await unshareFamilyDocument(docToUnshare.id);
      setActionMessage({
        type: 'success',
        text: `"${docToUnshare.originalFilename}" removed from Family Vault and returned to personal vault.`,
      });
      setDocToUnshare(null);
      await loadFamilyData();
      await onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to unshare document.' });
    } finally {
      setIsDeletingAction(false);
    }
  };

  // Handle reminder deletion
  const handleDeleteReminder = async () => {
    if (!reminderDialogDoc) return;
    setSavingReminder(true);
    try {
      await deleteDocumentExpiryReminder(reminderDialogDoc.id);
      setActionMessage({
        type: 'success',
        text: `Expiry reminder schedule removed for "${reminderDialogDoc.originalFilename}".`,
      });
      setReminderDialogDoc(null);
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to remove reminder schedule.' });
    } finally {
      setSavingReminder(false);
    }
  };

  // Handle live SHA-256 integrity verification
  const handleVerifyIntegrity = async (docId: string) => {
    setVerifyingDocId(docId);
    try {
      await verifyDocument(docId);
      await loadFamilyData();
      await onRefreshData();
      setActionMessage({
        type: 'success',
        text: 'Cryptographic SHA-256 baseline verification completed. File integrity confirmed.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Verification check failed.' });
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Handle reminder schedule save
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDialogDoc) return;
    setSavingReminder(true);
    try {
      await setDocumentExpiryReminder(reminderDialogDoc.id, reminderExpiryDate, reminderSelectedDays);
      setActionMessage({
        type: 'success',
        text: `Expiry reminder schedule saved for "${reminderDialogDoc.originalFilename}".`,
      });
      setReminderDialogDoc(null);
      await loadFamilyData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save reminder schedule.' });
    } finally {
      setSavingReminder(false);
    }
  };

  const isOwner = user.familyRole === 'Owner' || overview?.ownerId === user.id;

  // Filtered family documents
  const filteredDocs = familyDocs.filter((d) =>
    d.originalFilename.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Family Vault Header Card in Walnut Brown & Deep Espresso */}
      <div className="bg-gradient-to-r from-[#243B6B] via-[#432D1F] to-[#352317] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#4776D0]/30 text-[#EAF0FA] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#4776D0]/40">
                Shared Cryptographic Space
              </span>
              <span className="text-white/60 text-xs">·</span>
              <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#4776D0]" />
                Role-Based Family Vault
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
              <span>{overview?.name || 'TraceLock Family Vault'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#EAF0FA]/80 leading-relaxed">
              Secure family document repository with individual profile pictures, granular per-document Viewer/Editor access control, cryptographic SHA-256 verification, and a 30-day Recycle Bin recovery safety net.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 bg-[#4776D0] hover:bg-[#3358A6] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Document</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>
            )}

            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-[#EAF0FA] border border-white/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Change your profile picture"
            >
              <Camera className="w-4 h-4 text-[#4776D0]" />
              <span>My Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Family Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Family Documents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {familyDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members & Roles</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Expiry Reminders</span>
          {reminders.some((r) => r.isOverdue || r.daysRemaining <= 14) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('recycle-bin')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'recycle-bin'
              ? 'bg-[#243B6B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Recycle Bin</span>
          {recycleBinDocs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold">
              {recycleBinDocs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-500">Shared Documents</span>
                <div className="w-8 h-8 rounded-xl bg-[#EAF0FA] text-[#243B6B] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {overview?.documentCount ?? familyDocs.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#4776D0]" />
                <span>SHA-256 baseline verified</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-500">Family Members</span>
                <div className="w-8 h-8 rounded-xl bg-[#EAF0FA] text-[#243B6B] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {overview?.memberCount ?? members.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {members.filter((m) => m.membershipStatus === 'ACTIVE').length} Active Accounts
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-500">Pending Invitations</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {overview?.pendingInvitesCount ?? invitations.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Awaiting member confirmation
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-500">Recycle Bin Items</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {overview?.deletedDocumentsCount ?? recycleBinDocs.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                30-day retention safety net
              </div>
            </div>
          </div>

          {/* Member Profile Cards Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Family Member Profiles</h2>
                <p className="text-xs text-slate-500">
                  Registered members of {overview?.name || 'the vault'} with role badges and profile photos.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="px-3 py-1.5 bg-[#243B6B] text-white rounded-xl text-xs font-semibold hover:bg-[#1A2C52] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite New</span>
                </button>
              )}
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const isMemberOwner = member.familyRole === 'Owner';
                const isMemberEditor = member.familyRole === 'Editor';

                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#4776D0]/40 bg-slate-50/50 hover:bg-white transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#243B6B] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
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
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>

                      {/* Role Badge */}
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMemberOwner
                              ? 'bg-[#243B6B] text-white'
                              : isMemberEditor
                              ? 'bg-[#4776D0] text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {member.familyRole}
                        </span>
                        {member.isSelf && (
                          <span className="block text-[10px] text-[#243B6B] font-bold mt-1">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm truncate">{member.name}</div>
                      <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        {member.email}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                      <span className="text-emerald-700 font-semibold">{member.membershipStatus}</span>
                    </div>

                    {/* Action controls for Owner */}
                    {isOwner && !member.isSelf && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <select
                          value={member.familyRole}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as 'Owner' | 'Editor' | 'Viewer'
                            )
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 focus:outline-hidden focus:border-[#4776D0]"
                        >
                          <option value="Editor">Set as Editor</option>
                          <option value="Viewer">Set as Viewer</option>
                          <option value="Owner">Promote to Owner</option>
                        </select>

                        <button
                          onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove from Family"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {member.isSelf && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setIsAvatarModalOpen(true)}
                          className="w-full py-1 text-center text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Update Your Profile Photo</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column: Recent Activity & Upcoming Expiry Reminders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#243B6B]" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Family Activity</h3>
                </div>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="text-xs font-semibold text-[#243B6B] hover:underline"
                >
                  View All Activity &rarr;
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No activity recorded in this Family Vault yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 text-xs"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#243B6B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs mt-0.5">
                        {act.actorAvatarUrl ? (
                          <img
                            src={act.actorAvatarUrl}
                            alt={act.actorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          act.actorName.charAt(0)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 truncate">{act.actorName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-0.5 line-clamp-2">
                          {act.details}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Document Expiry Alerts */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#243B6B]" />
                  <h3 className="text-sm font-bold text-slate-900">Document Expiry Sentinel</h3>
                </div>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className="text-xs font-semibold text-[#243B6B] hover:underline"
                >
                  Manage Reminders &rarr;
                </button>
              </div>

              {reminders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No documents with expiration dates scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.slice(0, 4).map((rem) => (
                    <div
                      key={rem.documentId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        rem.isOverdue
                          ? 'bg-rose-50/60 border-rose-200'
                          : rem.daysRemaining <= 14
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-emerald-50/40 border-emerald-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 truncate">
                          {rem.documentName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Expires: {rem.expiryDate}</span>
                          <span className="font-semibold text-slate-700">({rem.category})</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rem.isOverdue
                              ? 'bg-rose-600 text-white'
                              : rem.daysRemaining <= 14
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {rem.isOverdue
                            ? 'OVERDUE'
                            : `${rem.daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAMILY DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Family Vault Documents</h2>
              <p className="text-xs text-slate-500">
                Shared family documents with verified SHA-256 baselines and per-member Viewer/Editor permissions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#4776D0]"
                />
              </div>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-2 bg-[#243B6B] text-white rounded-xl text-xs font-semibold hover:bg-[#1A2C52] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Share Document</span>
              </button>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-600">No Family Documents Found</div>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                Documents in your personal vault remain private until shared here with selected family members.
              </p>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 bg-[#243B6B] text-white rounded-xl text-xs font-semibold hover:bg-[#1A2C52] cursor-pointer inline-flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share from Personal Vault</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 font-semibold">Document</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Integrity Hash</th>
                    <th className="py-3 px-3 font-semibold">Access Permissions</th>
                    <th className="py-3 px-3 font-semibold">Expiry</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 hover:text-[#243B6B] cursor-pointer truncate max-w-[200px]"
                          onClick={() => onOpenDocDetails?.(doc)}
                        >
                          {doc.originalFilename}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {(doc.fileSize / 1024).toFixed(1)} KB · v{doc.versionNumber || 1}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-lg bg-[#EAF0FA] text-[#243B6B] font-semibold text-[10px] uppercase">
                          {doc.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{doc.sha256Baseline.slice(0, 12)}...</span>
                        </div>
                        <button
                          onClick={() => handleVerifyIntegrity(doc.id)}
                          disabled={verifyingDocId === doc.id}
                          className="text-[10px] text-[#243B6B] font-semibold hover:underline mt-0.5 cursor-pointer disabled:opacity-50"
                        >
                          {verifyingDocId === doc.id ? 'Checking...' : 'Verify Baseline'}
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        {/* Member Avatars Stack */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {doc.permissions && doc.permissions.length > 0 ? (
                            doc.permissions.map((p) => (
                              <div
                                key={p.userId}
                                title={`${p.userName} (${p.permission})`}
                                className="w-6 h-6 rounded-full border-2 border-white bg-[#243B6B] text-white flex items-center justify-center text-[10px] font-bold overflow-hidden"
                              >
                                {p.userAvatarUrl ? (
                                  <img src={p.userAvatarUrl} alt={p.userName} className="w-full h-full object-cover" />
                                ) : (
                                  p.userName.charAt(0)
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">Owner Only</span>
                          )}
                        </div>
                        <button
                          onClick={() => setPermissionDoc(doc)}
                          className="text-[10px] text-[#243B6B] hover:underline font-semibold mt-1 block cursor-pointer"
                        >
                          Manage Permissions ({doc.permissions?.length || 0})
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        {doc.expiryDate ? (
                          <div>
                            <span className="font-semibold text-slate-700">{doc.expiryDate}</span>
                            <button
                              onClick={() => {
                                setReminderDialogDoc(doc);
                                setReminderExpiryDate(doc.expiryDate || '');
                                setReminderSelectedDays(doc.reminderDaysBefore || [30, 14, 7]);
                              }}
                              className="text-[10px] text-[#4776D0] hover:underline block mt-0.5 cursor-pointer"
                            >
                              Edit Reminder
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReminderDialogDoc(doc);
                              setReminderExpiryDate('');
                              setReminderSelectedDays([30, 14, 7]);
                            }}
                            className="text-[10px] text-slate-400 hover:text-[#243B6B] hover:underline cursor-pointer"
                          >
                            + Set Expiry
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDocDetails?.(doc)}
                            className="p-1.5 text-slate-500 hover:text-[#243B6B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Details & Baseline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={`/api/documents/${doc.id}/download`}
                            download={doc.originalFilename}
                            className="p-1.5 text-slate-500 hover:text-[#243B6B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* Unshare / Return to Personal Vault */}
                          {(doc.ownerId === user.id || isOwner) && (
                            <button
                              onClick={() => setDocToUnshare(doc)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Unshare from Family (Return to Personal Vault)"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Move to Family Recycle Bin */}
                          <button
                            onClick={() => setDocToRecycle(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Move to Family Recycle Bin"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* TAB 3: MEMBERS & INVITATIONS */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Member Management Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Family Members</h2>
                <p className="text-xs text-slate-500">
                  Each family member has independent credentials and access restricted to authorized documents.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="px-3.5 py-2 bg-[#243B6B] text-white rounded-xl text-xs font-semibold hover:bg-[#1A2C52] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#243B6B] text-white font-bold text-base flex items-center justify-center shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{member.name}</div>
                      <div className="text-xs text-slate-500 font-mono truncate">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">Vault Role:</span>
                    <span className="font-bold text-[#243B6B] uppercase tracking-wider text-[11px]">
                      {member.familyRole}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Joined:</span>
                    <span className="font-mono">{new Date(member.joinedAt).toLocaleDateString()}</span>
                  </div>

                  {isOwner && !member.isSelf && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <select
                        value={member.familyRole}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as 'Owner' | 'Editor' | 'Viewer'
                          )
                        }
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700"
                      >
                        <option value="Viewer">Role: Viewer</option>
                        <option value="Editor">Role: Editor</option>
                        <option value="Owner">Role: Owner</option>
                      </select>

                      <button
                        onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations Table */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Pending Invitations ({invitations.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Invited Email</th>
                      <th className="py-2.5 px-3">Assigned Role</th>
                      <th className="py-2.5 px-3">Invited By</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 px-3 font-semibold text-slate-800">{inv.invitedEmail}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                            {inv.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{inv.invitedByName}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {new Date(inv.invitedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setInvitationToRevoke({ id: inv.id, email: inv.invitedEmail })}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Family Permissions Matrix Guide */}
          <div className="bg-[#F5F7FB] rounded-2xl border border-[#4776D0]/30 p-6 space-y-3 text-xs">
            <h3 className="font-bold text-[#243B6B] text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4776D0]" />
              <span>TraceLock Family Role Permissions Matrix</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#243B6B] uppercase tracking-wider text-[11px] block">
                  Owner
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Full control of vault. Manage members, change roles, invite/remove members, share documents, restore from Recycle Bin, and execute permanent deletions.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-[#4776D0] uppercase tracking-wider text-[11px] block">
                  Editor
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  View and download authorized documents, upload updated document versions, digital signature verification, and restore files from Recycle Bin.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px] block">
                  Viewer
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Inspect and download permitted documents. Cannot edit documents, upload versions, delete files, or alter member permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Family Activity Timeline</h2>
              <p className="text-xs text-slate-500">
                Chronological tamper-evident audit record of all document actions, permissions, and member events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#4776D0]"
              >
                <option value="ALL">All Activity</option>
                <option value="DOCUMENT_UPLOADED">Uploads & Shares</option>
                <option value="DOCUMENT_VIEWED">Views</option>
                <option value="DOCUMENT_DOWNLOADED">Downloads</option>
                <option value="DOCUMENT_MODIFIED">Modifications</option>
                <option value="DOCUMENT_DELETED">Deletions</option>
                <option value="DOCUMENT_RESTORED">Restorations</option>
                <option value="MEMBER_INVITED">Member Invites</option>
                <option value="PERMISSION_UPDATED">Permission Updates</option>
                <option value="EXPIRY_REMINDER_SET">Expiry Reminders</option>
              </select>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No activity records match the selected filter.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.map((act) => (
                <div key={act.id} className="relative flex items-start gap-4 text-xs">
                  {/* Timeline bullet with avatar */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white bg-[#243B6B] text-white flex items-center justify-center shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#4776D0]" />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all flex-1 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg overflow-hidden bg-[#243B6B] text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                          {act.actorAvatarUrl ? (
                            <img src={act.actorAvatarUrl} alt={act.actorName} className="w-full h-full object-cover" />
                          ) : (
                            act.actorName.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{act.actorName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-semibold uppercase">
                          {act.action.replace('DOCUMENT_', '').replace('MEMBER_', '')}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{act.details}</p>

                    {act.documentName && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#243B6B] font-semibold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Document: {act.documentName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EXPIRY REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Document Expiry Reminders</h2>
            <p className="text-xs text-slate-500">
              Track renewal timelines for family insurance policies, vehicle registrations, passports, and warranties.
            </p>
          </div>

          {reminders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-600">No Document Reminders Active</div>
              <p className="text-xs text-slate-400">
                You can set expiry schedules on any Family Vault document from the Documents tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reminders.map((rem) => (
                <div
                  key={rem.documentId}
                  className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
                    rem.isOverdue
                      ? 'bg-rose-50/50 border-rose-200'
                      : rem.daysRemaining <= 14
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                      {rem.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rem.isOverdue
                          ? 'bg-rose-600 text-white'
                          : rem.daysRemaining <= 14
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {rem.isOverdue ? 'EXPIRED' : `${rem.daysRemaining} days left`}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {rem.documentName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#243B6B]" />
                      <span>Expires: {rem.expiryDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                    <span>Alert Schedule: [{rem.reminderDaysBefore.join(', ')}] days prior</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RECYCLE BIN */}
      {activeTab === 'recycle-bin' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Family Vault Recycle Bin</h2>
              <p className="text-xs text-slate-500">
                Deleted documents are quarantined here for 30 days before permanent purging. Integrity baselines and versions remain intact.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {recycleBinDocs.length > 0 && (
                <button
                  onClick={() => setIsEmptyRecycleBinModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Recycle Bin</span>
                </button>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>30-Day Retention Policy Active</span>
              </div>
            </div>
          </div>

          {recycleBinDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Trash2 className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-600">Recycle Bin Is Empty</div>
              <p className="text-xs text-slate-400">
                No deleted documents are currently in the 30-day retention queue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3 font-semibold">Document</th>
                    <th className="py-3 px-3 font-semibold">Deleted Timestamp</th>
                    <th className="py-3 px-3 font-semibold">Deleted By</th>
                    <th className="py-3 px-3 font-semibold">Retention Left</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recycleBinDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 truncate max-w-[220px]">
                          {doc.originalFilename}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {doc.category} · {(doc.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(doc.deletedAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg overflow-hidden bg-[#243B6B] text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                            {doc.deletedByAvatarUrl ? (
                              <img src={doc.deletedByAvatarUrl} alt={doc.deletedByName} className="w-full h-full object-cover" />
                            ) : (
                              doc.deletedByName.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-slate-800">{doc.deletedByName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {doc.daysRemaining} days remaining
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.canRestore && (
                            <button
                              onClick={() => handleRestoreDoc(doc.id, doc.originalFilename)}
                              className="px-3 py-1.5 bg-[#243B6B] hover:bg-[#1A2C52] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}

                          {doc.canPermanentDelete && (
                            <button
                              onClick={() => setDocToPurge(doc)}
                              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Purge</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Profile Avatar Modal */}
      {isAvatarModalOpen && (
        <ProfileAvatarModal
          user={user}
          onClose={() => setIsAvatarModalOpen(false)}
          onSuccess={(updatedUser) => {
            onUserUpdate?.(updatedUser);
            loadFamilyData();
          }}
        />
      )}

      {/* MODAL 2: Share to Family Modal */}
      {isShareModalOpen && (
        <ShareToFamilyModal
          documents={personalDocuments}
          members={members}
          onClose={() => setIsShareModalOpen(false)}
          onSuccess={async () => {
            await loadFamilyData();
            await onRefreshData();
            setActiveTab('documents');
          }}
        />
      )}

      {/* MODAL 3: Manage Permissions Modal */}
      {permissionDoc && (
        <ManagePermissionsModal
          document={permissionDoc}
          members={members}
          onClose={() => setPermissionDoc(null)}
          onSuccess={async () => {
            await loadFamilyData();
          }}
        />
      )}

      {/* MODAL 4: Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#243B6B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#4776D0]" />
                <h3 className="text-base font-bold">Invite Family Member</h3>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Family Member's Email</label>
                <input
                  type="email"
                  placeholder="e.g. member@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#4776D0]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Family Vault Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Editor' | 'Viewer')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-[#4776D0]"
                >
                  <option value="Viewer">Viewer (Can View & Download assigned documents)</option>
                  <option value="Editor">Editor (Can Upload versions & View/Download)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
                An invitation will be added to the vault and automatically linked once registered.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-[#243B6B] text-white rounded-xl font-semibold hover:bg-[#1A2C52] transition-colors"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Expiry Reminder Schedule Dialog */}
      {reminderDialogDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#243B6B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#4776D0]" />
                <h3 className="text-base font-bold">Configure Expiry & Reminders</h3>
              </div>
              <button onClick={() => setReminderDialogDoc(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#F5F7FB] rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-800 truncate">{reminderDialogDoc.originalFilename}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Category: {reminderDialogDoc.category}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Document Expiration Date</label>
                <input
                  type="date"
                  value={reminderExpiryDate}
                  onChange={(e) => setReminderExpiryDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#4776D0]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Notification Schedule (Days Before Expiry)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[30, 14, 7, 1].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setReminderSelectedDays((prev) =>
                          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        reminderSelectedDays.includes(day)
                          ? 'bg-[#243B6B] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {day} days before
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {reminderDialogDoc.expiryDate ? (
                  <button
                    type="button"
                    onClick={handleDeleteReminder}
                    disabled={savingReminder}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Clear Reminder
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderDialogDoc(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReminder}
                    className="px-5 py-2 bg-[#243B6B] text-white rounded-xl font-semibold text-xs hover:bg-[#1A2C52] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {savingReminder ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Move Document to Recycle Bin Confirmation */}
      {docToRecycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Move to Recycle Bin</h3>
                  <p className="text-xs text-slate-500">30-day quarantine retention policy</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to move <strong className="text-slate-900 font-semibold font-mono">"{docToRecycle.originalFilename}"</strong> to the Family Vault Recycle Bin?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Clock className="w-3.5 h-3.5" />
                  <span>30-Day Safe Recovery</span>
                </div>
                <p>
                  The document and its registered SHA-256 cryptographic baseline will be preserved. Any authorized member can restore it at any time within 30 days.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setDocToRecycle(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executeDeleteToRecycleBin}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAction ? 'Moving...' : 'Move to Recycle Bin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Permanently Purge Document Confirmation */}
      {docToPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Permanently Purge Document</h3>
                  <p className="text-xs text-rose-600 font-semibold">Irreversible disk and database deletion</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                WARNING: You are about to permanently purge <strong className="text-slate-900 font-semibold font-mono">"{docToPurge.originalFilename}"</strong>.
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 space-y-1">
                <p className="font-semibold text-rose-900">This action cannot be undone.</p>
                <p>
                  The physical storage file, cryptographic SHA-256 verification records, and per-document access grants will be permanently purged from the system.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setDocToPurge(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executePermanentDelete}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAction ? 'Purging...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Empty Entire Recycle Bin Confirmation */}
      {isEmptyRecycleBinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Empty Family Recycle Bin</h3>
                  <p className="text-xs text-rose-600 font-semibold">Bulk permanent destruction</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently purge all <strong className="text-slate-900 font-bold">{recycleBinDocs.length}</strong> document(s) currently in the Family Recycle Bin?
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 space-y-1">
                <p className="font-semibold text-rose-900">Irrevocable bulk purging</p>
                <p>
                  All physical files in secure storage and registered integrity baselines will be purged immediately. None of these documents can be recovered.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setIsEmptyRecycleBinModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executeEmptyRecycleBin}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAction ? 'Emptying...' : 'Empty Entire Recycle Bin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Remove Member Confirmation */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove Family Member</h3>
                  <p className="text-xs text-slate-500">Revoke vault membership</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900 font-bold">{memberToRemove.name}</strong> from the Family Vault?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>
                  Their explicit permissions on all family documents will be revoked immediately. Their personal vault documents will remain completely intact.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setMemberToRemove(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executeRemoveMember}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAction ? 'Removing...' : 'Remove Member'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Revoke Invitation Confirmation */}
      {invitationToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revoke Invitation</h3>
                  <p className="text-xs text-slate-500">Cancel pending family access</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel the invitation sent to <strong className="text-slate-900 font-bold">{invitationToRevoke.email}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setInvitationToRevoke(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Keep Invitation
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executeRevokeInvitation}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isDeletingAction ? 'Revoking...' : 'Revoke Invitation'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Unshare Document from Family Vault Confirmation */}
      {docToUnshare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove from Family Vault</h3>
                  <p className="text-xs text-slate-500">Return to Personal Vault only</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Remove <strong className="text-slate-900 font-semibold font-mono">"{docToUnshare.originalFilename}"</strong> from the Family Vault?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>
                  This document will <strong>not</strong> be deleted. It will remain safe in your Personal Vault, but will no longer be visible or accessible to other family members.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={() => setDocToUnshare(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAction}
                  onClick={executeUnshareDoc}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isDeletingAction ? 'Removing...' : 'Remove from Family'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
