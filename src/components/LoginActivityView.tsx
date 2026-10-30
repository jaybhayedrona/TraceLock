import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Zap,
  Globe,
  Monitor,
  Eye,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { LoginActivityLog, EmailNotificationRecord, User } from '../types';
import {
  getLoginActivityLogs,
  getEmailAlerts,
  unlockAccount,
  simulateUnauthorizedAttack,
} from '../api';

interface LoginActivityViewProps {
  user: User;
  onRefreshParent?: () => Promise<void>;
  onTriggerAlertPopup?: (alert: any) => void;
}

export function LoginActivityView({
  user,
  onRefreshParent,
  onTriggerAlertPopup,
}: LoginActivityViewProps) {
  const [logs, setLogs] = useState<LoginActivityLog[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    success: 0,
    failed: 0,
    blocked: 0,
    lockoutsActive: 0,
  });
  const [lockedAccounts, setLockedAccounts] = useState<
    { email: string; lockoutRemainingSeconds: number; attempts: number }[]
  >([]);
  const [emails, setEmails] = useState<EmailNotificationRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificationRecord | null>(null);

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [activityRes, emailRes] = await Promise.all([
        getLoginActivityLogs(),
        getEmailAlerts().catch(() => ({ emails: [] })),
      ]);
      setLogs(activityRes.logs);
      setMetrics(activityRes.metrics);
      setLockedAccounts(activityRes.lockedAccounts || []);
      setEmails(emailRes.emails || []);
    } catch (err: any) {
      console.error('Failed to load login activity data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAttack = async () => {
    setSimulating(true);
    setActionNotice(null);
    try {
      const res = await simulateUnauthorizedAttack(user.email);
      setActionNotice({
        type: 'success',
        text: `Intrusion simulation executed: 3 failed attempts recorded on ${res.targetEmail}. Security alert & email dispatched.`,
      });
      await loadData();
      if (onRefreshParent) await onRefreshParent();
      if (onTriggerAlertPopup && res.alert) {
        onTriggerAlertPopup(res.alert);
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Failed to simulate unauthorized attack.',
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleUnlock = async (targetEmail: string) => {
    setUnlockingEmail(targetEmail);
    try {
      const res = await unlockAccount(targetEmail);
      setActionNotice({
        type: 'success',
        text: res.message || `Account ${targetEmail} unlocked successfully.`,
      });
      await loadData();
      if (onRefreshParent) await onRefreshParent();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Failed to unlock account.',
      });
    } finally {
      setUnlockingEmail(null);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = log.email.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      const matchUser = log.userName ? log.userName.toLowerCase().includes(q) : false;
      const matchReason = log.failureReason ? log.failureReason.toLowerCase().includes(q) : false;
      return matchEmail || matchIp || matchUser || matchReason;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#4776D0]/10 text-[#243B6B] border border-[#4776D0]/20 text-[11px] font-semibold uppercase tracking-wider">
              Cryptographic Access Shield
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">JWT & Bcrypt Gateway</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Login Activity & Unauthorized Intrusion Detection
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time forensic ledger tracking authenticated sessions, credential stuffing attempts, and automatic account lockouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-[#243B6B] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#243B6B]' : ''}`} />
          </button>

          {/* Test Lab Attack Simulator Button */}
          <button
            onClick={handleSimulateAttack}
            disabled={simulating}
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Simulate 3 failed login attempts from an untrusted IP address to trigger the popup alert"
          >
            <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
            <span>{simulating ? 'Simulating...' : 'Simulate Unauthorized Login Attack'}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Attempts</span>
            <Globe className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-400">All registered gateway events</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Successful Sign-Ins</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {metrics.success}
          </div>
          <div className="text-[11px] text-emerald-700/80 font-medium">Bcrypt & JWT Verified</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Failed Attempts</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {metrics.failed}
          </div>
          <div className="text-[11px] text-rose-700/80 font-medium">Failed credentials tracked</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Active Lockouts</span>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {metrics.lockoutsActive}
          </div>
          <div className="text-[11px] text-amber-800/80 font-medium">15-min lockout defense</div>
        </div>
      </div>

      {/* Locked Accounts Management (Admin / Self Protection) */}
      {lockedAccounts.length > 0 && (
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Accounts Currently in Quarantine Lockout ({lockedAccounts.length})</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              Rate Limiting & Temporary Lockout Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lockedAccounts.map((acc) => (
              <div
                key={acc.email}
                className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{acc.email}</div>
                  <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.ceil(acc.lockoutRemainingSeconds / 60)}m lockout remaining ({acc.attempts} failed tries)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUnlock(acc.email)}
                  disabled={unlockingEmail === acc.email}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Unlock Account"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{unlockingEmail === acc.email ? 'Unlocking...' : 'Unlock Account'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, IP, browser..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#4776D0]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#4776D0]"
          >
            <option value="ALL">All Statuses ({logs.length})</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Attempts</option>
            <option value="BLOCKED_LOCKED">Blocked & Locked</option>
          </select>

          {emails.length > 0 && (
            <button
              onClick={() => setSelectedEmail(emails[0])}
              className="px-3 py-1.5 bg-[#4776D0]/10 hover:bg-[#4776D0]/20 text-[#243B6B] border border-[#4776D0]/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#4776D0]" />
              <span>Email Alerts ({emails.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Globe className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-600">No Login Activity Found</div>
            <p className="text-xs text-slate-400">
              {searchQuery ? 'Try clearing your search query filter.' : 'All authentication events will be recorded here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/70">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Target Account</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Client / Device</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isBlocked = log.status === 'BLOCKED_LOCKED';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{log.email}</div>
                        {log.userName && (
                          <div className="text-[10px] text-slate-400">{log.userName}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {log.ipAddress}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 font-mono text-[11px]" title={log.userAgent}>
                        {log.userAgent}
                      </td>

                      <td className="py-3 px-4">
                        {isSuccess && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>SUCCESS</span>
                          </span>
                        )}
                        {!isSuccess && !isBlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>FAILED</span>
                          </span>
                        )}
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>BLOCKED / LOCKED</span>
                          </span>
                        )}
                        {log.failureReason && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {log.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {log.alertTriggered ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-semibold text-[10px] border border-rose-200 flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Alert Dispatched</span>
                          </span>
                        ) : isSuccess ? (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            JWT Session Issued
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Threshold Monitored
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Alert Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#1E3159]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4776D0]" />
                <h3 className="text-sm font-semibold tracking-wide">Dispatched Security Notification</h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-white/70 hover:text-white text-xl leading-none font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
                <div><strong>To:</strong> {selectedEmail.recipientEmail}</div>
                <div><strong>Subject:</strong> {selectedEmail.subject}</div>
                <div><strong>Dispatched:</strong> {new Date(selectedEmail.sentAt).toLocaleString()}</div>
                <div><strong>Status:</strong> {selectedEmail.status} (TraceLock Security Dispatcher)</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 leading-relaxed space-y-3">
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Automated intrusion defense record</span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
