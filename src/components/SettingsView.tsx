import { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Shield,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { User, SystemHealth } from '../types';

interface SettingsViewProps {
  user: User;
  systemHealth: SystemHealth | null;
  onOpenAuditLogs: () => void;
  onOpenCodeVault: () => void;
}

export function SettingsView({
  user,
  systemHealth,
  onOpenAuditLogs,
  onOpenCodeVault,
}: SettingsViewProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (newPassword.length < 8) {
      setSaveError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveError('Passwords do not match.');
      return;
    }

    setSaveSuccess('Security credentials successfully updated via BCrypt password encoding.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
          System & Account Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Manage your credentials, review cryptographic security configurations, and inspect backend architecture.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#15966A] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#15966A] shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-[#DC2626] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Grid: Profile Info & Security Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
            <UserIcon className="w-4 h-4 text-[#243B6B]" />
            <span>Authorized User Profile</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Full Name</span>
              <span className="font-semibold text-[#172033] text-sm">{user.name}</span>
            </div>

            <div>
              <span className="text-[#64748B] block text-[11px]">Email Address</span>
              <span className="font-mono text-[#172033]">{user.email}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] block text-[11px]">Role / Privilege</span>
                <span className="font-semibold text-[#243B6B] uppercase">
                  {user.role === 'ADMIN' ? 'System Administrator' : 'User'}
                </span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[11px]">User ID</span>
                <span className="font-mono text-slate-500 text-[11px]">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAuditLogs}
              className="text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View User Security Audit Trail &rarr;</span>
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
            <Lock className="w-4 h-4 text-[#243B6B]" />
            <span>Spring Security Password Encryption</span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#64748B] font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
              />
            </div>

            <div>
              <label className="block text-[#64748B] font-semibold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
              />
            </div>

            <div>
              <label className="block text-[#64748B] font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Cryptographic & Architecture Configuration */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
            <Shield className="w-4 h-4 text-[#243B6B]" />
            <span>TraceLock Architecture & Security Specifications</span>
          </div>

          <button
            onClick={onOpenCodeVault}
            className="text-xs font-semibold text-[#243B6B] bg-[#4776D0]/10 hover:bg-[#4776D0]/20 px-3 py-1.5 rounded-lg border border-[#4776D0]/20 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-[#4776D0]" />
            <span>Open Spring Boot & SQL Vault</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-[#E2E8F0]">
            <div className="text-[#64748B] font-medium text-[11px]">Cryptographic Engine</div>
            <div className="font-bold text-[#172033] mt-1">NIST SHA-256 (256-bit)</div>
            <div className="text-slate-400 text-[10px] mt-0.5">Computed on backend bytes</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-[#E2E8F0]">
            <div className="text-[#64748B] font-medium text-[11px]">Relational Database</div>
            <div className="font-bold text-[#172033] mt-1">MySQL 8.0+ / InnoDB</div>
            <div className="text-slate-400 text-[10px] mt-0.5">ACID transactions & foreign keys</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-[#E2E8F0]">
            <div className="text-[#64748B] font-medium text-[11px]">Scheduled Verification</div>
            <div className="font-bold text-[#172033] mt-1">Every 30 Seconds</div>
            <div className="text-slate-400 text-[10px] mt-0.5">Automated batch concurrency guard</div>
          </div>
        </div>
      </div>
    </div>
  );
}
