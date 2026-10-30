import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Globe,
  Monitor,
  Mail,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
} from 'lucide-react';
import { UnauthorizedLoginAlertData } from '../types';
import { dismissUnauthorizedAlert } from '../api';

interface UnauthorizedLoginAlertModalProps {
  alert: UnauthorizedLoginAlertData;
  onDismiss: () => void;
  onNavigateToActivity?: () => void;
}

export function UnauthorizedLoginAlertModal({
  alert,
  onDismiss,
  onNavigateToActivity,
}: UnauthorizedLoginAlertModalProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [countdown, setCountdown] = useState<number>(alert.lockoutRemainingSeconds || 0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await dismissUnauthorizedAlert(alert.id);
    } catch (err) {
      console.warn('Error dismissing alert:', err);
    } finally {
      setIsDismissing(false);
      onDismiss();
    }
  };

  const minutesRemaining = Math.ceil(countdown / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#FECACA] overflow-hidden my-6">
        {/* Urgent Header in Crimson Danger #DC2626 */}
        <div className="bg-[#DC2626] text-white px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                Intrusion Detection Alert
              </span>
              <h2 className="text-base font-bold text-white mt-0.5 leading-tight">
                Suspicious Login Attempts Detected
              </h2>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-[#FEF2F2] rounded-xl border border-[#FECACA] text-[#991B1B] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Multiple failed sign-in attempts on your account:
              </p>
              <p className="mt-0.5 text-[#7F1D1D] leading-relaxed">
                Repeated unauthorized login attempts were recorded for <strong className="font-semibold">{alert.email}</strong>. TraceLock has temporarily applied rate-limiting and logged forensic attack metadata.
              </p>
            </div>
          </div>

          {/* Forensic Attack Metadata Card */}
          <div className="bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] p-4 space-y-2.5 text-xs">
            <div className="font-bold text-[#172033] text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Incident Forensic Record</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] font-mono font-bold text-[10px] border border-[#FECACA]">
                {alert.attemptsCount} Failed Attempts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[#64748B]">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#243B6B] shrink-0" />
                <span>
                  <strong className="text-[#172033]">Source IP:</strong>{' '}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] font-semibold text-[#172033]">
                    {alert.ipAddress}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#243B6B] shrink-0" />
                <span>
                  <strong className="text-[#172033]">Detected:</strong>{' '}
                  {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Monitor className="w-3.5 h-3.5 text-[#243B6B] shrink-0" />
                <span className="truncate">
                  <strong className="text-[#172033]">Client UA:</strong>{' '}
                  <span className="font-mono text-[11px] text-[#64748B]">{alert.userAgent}</span>
                </span>
              </div>
            </div>

            {/* Lockout Status Indicator */}
            {alert.isLocked && countdown > 0 && (
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[#92400E] bg-[#FFFBEB] p-2 rounded-lg border border-[#FDE68A]">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Account Quarantined</span>
                </div>
                <div className="font-mono text-xs font-bold text-[#92400E]">
                  {minutesRemaining}m lockout remaining
                </div>
              </div>
            )}
          </div>

          {/* Email Alert Confirmation */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] bg-[#EEF4FC] border border-[#C8DBFA] p-3 rounded-xl">
            <Mail className="w-4 h-4 text-[#4776D0] shrink-0" />
            <span>
              An automated forensic security report was dispatched to <strong>{alert.email}</strong>.
            </span>
          </div>

          {/* Action Recommendations */}
          <div className="space-y-1.5 text-xs text-[#172033]">
            <div className="font-bold text-[#243B6B]">Recommended Protective Actions:</div>
            <ul className="space-y-1 list-disc list-inside text-[#64748B]">
              <li>Review the Login Activity Ledger to inspect recent IP origins.</li>
              <li>If you did not initiate these attempts, change your password immediately.</li>
              <li>Ensure multi-tiered cryptographic baseline monitoring is active.</li>
            </ul>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            {onNavigateToActivity && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToActivity();
                  handleDismiss();
                }}
                className="px-4 py-2 bg-[#F5F7FB] hover:bg-[#E2E8F0] text-[#172033] rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Activity Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={isDismissing}
              onClick={handleDismiss}
              className="px-4 py-2 bg-[#243B6B] hover:bg-[#1D315B] text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isDismissing ? 'Acknowledging...' : 'Acknowledge & Dismiss'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
