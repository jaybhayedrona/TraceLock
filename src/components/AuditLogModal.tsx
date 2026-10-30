import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { AuditLog } from '../types';
import { getAuditLogs } from '../api';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAuditLogs()
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#1E3159]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#4776D0]" />
            <h2 className="text-sm font-semibold tracking-wide">Immutable Security Audit Ledger</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none font-medium cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          <div className="p-3 rounded-lg bg-[#F5F7FB] border border-[#E2E8F0] text-[#64748B] text-[11px]">
            Every authentication attempt, document upload, verification cycle, download, and baseline authorization is recorded in this tamper-evident audit trail.
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#64748B]">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[#64748B]">No audit records found.</div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#172033] font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                        {log.action}
                      </span>
                      <span className="text-[#64748B] text-[11px]">by {log.userName}</span>
                    </div>
                    <p className="text-[#172033] text-[11px]">{log.details}</p>
                    <div className="font-mono text-[10px] text-[#64748B]">
                      Resource: {log.resourceType} · ID: {log.resourceId} · IP: {log.ipAddress}
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-slate-400 tabular-nums shrink-0 text-right">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-[#E2E8F0] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
