import { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  FileText,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  SecurityAlert,
  IntegrityIncident,
  DocumentItem,
} from '../types';
import {
  markAlertRead,
  resolveAlert,
  approveBaseline,
} from '../api';

interface AlertsViewProps {
  alerts: SecurityAlert[];
  incidents: IntegrityIncident[];
  documents: DocumentItem[];
  onRefresh: () => Promise<void>;
  onNavigateToTestLab: () => void;
}

export function AlertsView({
  alerts,
  incidents,
  documents,
  onRefresh,
  onNavigateToTestLab,
}: AlertsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('UNRESOLVED');

  // Baseline approval modal state
  const [approveIncident, setApproveIncident] = useState<IntegrityIncident | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = filterSeverity === 'ALL' || alert.severity === filterSeverity;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'UNRESOLVED' && !alert.isResolved) ||
      (filterStatus === 'RESOLVED' && alert.isResolved);
    return matchesSeverity && matchesStatus;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const handleMarkRead = async (alert: SecurityAlert) => {
    try {
      await markAlertRead(alert.id);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (alert: SecurityAlert) => {
    try {
      await resolveAlert(alert.id);
      await onRefresh();
      setActionSuccess(`Alert "${alert.title}" marked as resolved.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveBaselineSubmit = async () => {
    if (!approveIncident) return;
    setApproving(true);
    setActionError(null);
    try {
      await approveBaseline(approveIncident.id, approvalNotes);
      await onRefresh();
      setActionSuccess(`New baseline authorized for "${approveIncident.documentName}". Cryptographic records and audit trail updated.`);
      setApproveIncident(null);
      setApprovalNotes('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve baseline');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Security Alerts & Incidents
            </h1>
            {unreadCount > 0 && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 tabular-nums">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time automatic alerts triggered by cryptographic hash deviations or storage anomalies.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">All Alerts</option>
            <option value="UNRESOLVED">Unresolved Incidents Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold text-emerald-800 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold text-rose-800 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Active Incidents Spotlight Card */}
      {incidents.filter((i) => i.status === 'UNRESOLVED').length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Active Cryptographic Mismatch Incidents</span>
          </div>

          <div className="space-y-3">
            {incidents
              .filter((i) => i.status === 'UNRESOLVED')
              .map((inc) => (
                <div
                  key={inc.id}
                  className="bg-white p-4 rounded-xl border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{inc.documentName}</span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {inc.id}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] font-mono break-all">
                      Expected Baseline: <span className="text-slate-800">{inc.expectedHash.substring(0, 24)}...</span>
                      <br />
                      Detected Physical: <span className="text-rose-700 font-bold">{inc.detectedHash.substring(0, 24)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setApproveIncident(inc)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#EEF4FC]" />
                      <span>Approve New Baseline</span>
                    </button>

                    <button
                      onClick={onNavigateToTestLab}
                      className="px-3 py-1.5 text-xs font-semibold text-[#243B6B] bg-white hover:bg-[#EEF4FC] border border-[#C8DBFA] rounded-lg transition-colors cursor-pointer"
                    >
                      Restore in Test Lab
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No security alerts matching criteria.</p>
            <p className="mt-1">All monitored documents are currently reporting intact cryptographic status.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                alert.isResolved
                  ? 'bg-white border-slate-200/80 opacity-80'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-white border-rose-200 shadow-xs ring-1 ring-rose-100'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs mb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{alert.title}</span>
                      {!alert.isRead && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                      <span className="font-mono">ID: {alert.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>Target: <strong>{alert.documentName}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      alert.isResolved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {alert.isResolved ? 'RESOLVED' : 'UNRESOLVED'}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-slate-700 text-xs mb-3 leading-relaxed">
                {alert.message}
              </p>

              {/* Hash Comparison Box if Mismatch */}
              {alert.previousHash && alert.currentHash && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-3 space-y-1.5 text-[11px] font-mono">
                  <div className="text-slate-600">
                    <span className="text-slate-400 font-sans font-medium">Registered Reference Baseline:</span>{' '}
                    <span className="text-[#243B6B] break-all">{alert.previousHash}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400 font-sans font-medium">Detected Storage Byte Signature:</span>{' '}
                    <span className="text-[#DC2626] font-bold break-all">{alert.currentHash}</span>
                  </div>
                </div>
              )}

              {/* Recommended Action */}
              <div className="text-[11px] text-[#64748B] bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E2E8F0] mb-3">
                <span className="font-semibold text-[#243B6B]">Recommended Action:</span>{' '}
                {alert.recommendedAction}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div className="text-slate-400 text-[11px]">
                  Category: <span className="font-mono text-slate-600">{alert.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkRead(alert)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Mark Read
                    </button>
                  )}

                  {!alert.isResolved && (
                    <button
                      onClick={() => handleResolveAlert(alert)}
                      className="px-3 py-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* APPROVE BASELINE MODAL */}
      {approveIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#EEF4FC]" />
                <span>Authorize New Baseline Reference</span>
              </h2>
              <button
                onClick={() => setApproveIncident(null)}
                className="text-white/70 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#64748B] leading-relaxed">
                You are updating the trusted cryptographic reference for <strong>{approveIncident.documentName}</strong>.
                This action indicates that the detected change is legitimate and authorized. An immutable entry will be recorded in the audit trail.
              </p>

              <div className="p-3 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-[#64748B] font-sans">Previous Baseline:</span>{' '}
                  <span className="break-all text-[#172033]">{approveIncident.expectedHash}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-sans">New Baseline:</span>{' '}
                  <span className="break-all text-[#243B6B] font-bold">{approveIncident.detectedHash}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Investigation &amp; Approval Notes
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Document was officially re-signed with revised educational degree stamp."
                  className="w-full p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] bg-[#F5F7FB] hover:bg-[#E2E8F0] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveBaselineSubmit}
                  disabled={approving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1D315B] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {approving ? 'Authorizing...' : 'Authorize & Update Baseline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
