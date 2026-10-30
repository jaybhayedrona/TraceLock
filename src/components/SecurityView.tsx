import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  ShieldAlert,
  KeyRound,
  Lock,
} from 'lucide-react';
import {
  SecurityAlert,
  IntegrityIncident,
  DocumentItem,
  SystemHealth,
  User,
  UnauthorizedLoginAlertData,
} from '../types';
import { AlertsView } from './AlertsView';
import { TestLabView } from './TestLabView';
import { LoginActivityView } from './LoginActivityView';
import { UnauthorizedLoginAlertModal } from './UnauthorizedLoginAlertModal';
import { getUnauthorizedLoginAlerts } from '../api';

interface SecurityViewProps {
  user: User;
  alerts: SecurityAlert[];
  incidents: IntegrityIncident[];
  documents: DocumentItem[];
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function SecurityView({
  user,
  alerts,
  incidents,
  documents,
  systemHealth,
  onRefresh,
}: SecurityViewProps) {
  const [subTab, setSubTab] = useState<'alerts' | 'activity' | 'testlab'>('alerts');
  const [activeUnauthorizedAlert, setActiveUnauthorizedAlert] = useState<UnauthorizedLoginAlertData | null>(null);

  // Check for active unauthorized login alerts for this user/system
  const checkUnauthorizedAlerts = async () => {
    try {
      const res = await getUnauthorizedLoginAlerts();
      if (res.alerts && res.alerts.length > 0) {
        // Find most recent unresolved alert
        setActiveUnauthorizedAlert(res.alerts[0]);
      } else {
        setActiveUnauthorizedAlert(null);
      }
    } catch (err) {
      console.warn('Failed to fetch unauthorized alerts', err);
    }
  };

  useEffect(() => {
    checkUnauthorizedAlerts();
    const interval = setInterval(checkUnauthorizedAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;
  const unresolvedIncidentsCount = incidents.filter((i) => i.status === 'UNRESOLVED').length;
  const unauthorizedAlertsCount = alerts.filter((a) => a.category === 'UNAUTHORIZED_LOGIN_ATTEMPT' && !a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Segmented Bar */}
      <div className="bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Alerts & Incidents */}
          <button
            onClick={() => setSubTab('alerts')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'alerts'
                ? 'bg-[#243B6B] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F7FB]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Alerts &amp; Incidents</span>
            {unreadAlertsCount > 0 && (
              <span className="font-mono text-[10px] bg-[#DC2626] text-white px-1.5 py-0.5 rounded-full font-bold">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* 2. Login Activity & Intrusion Detection */}
          <button
            onClick={() => setSubTab('activity')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'activity'
                ? 'bg-[#243B6B] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F7FB]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login Activity &amp; Intrusion Detection</span>
            {unauthorizedAlertsCount > 0 && (
              <span className="font-mono text-[10px] bg-[#D97706] text-white px-1.5 py-0.5 rounded-full font-bold">
                !
              </span>
            )}
          </button>

          {/* 3. Test Lab */}
          <button
            onClick={() => setSubTab('testlab')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'testlab'
                ? 'bg-[#243B6B] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F7FB]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Integrity &amp; Fault Tolerance Test Lab</span>
          </button>
        </div>

        {unresolvedIncidentsCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#DC2626] bg-[#FEF2F2] px-3 py-1.5 rounded-xl border border-[#FECACA]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{unresolvedIncidentsCount} Cryptographic Deviation</span>
          </div>
        )}
      </div>

      {/* Render selected view */}
      {subTab === 'alerts' && (
        <AlertsView
          alerts={alerts}
          incidents={incidents}
          documents={documents}
          onRefresh={onRefresh}
          onNavigateToTestLab={() => setSubTab('testlab')}
        />
      )}

      {subTab === 'activity' && (
        <LoginActivityView
          user={user}
          onRefreshParent={onRefresh}
          onTriggerAlertPopup={(alert) => setActiveUnauthorizedAlert(alert)}
        />
      )}

      {subTab === 'testlab' && (
        <TestLabView
          documents={documents}
          systemHealth={systemHealth}
          onRefresh={onRefresh}
          onNavigateToAlerts={() => setSubTab('alerts')}
        />
      )}

      {/* Unauthorized Login Alert Popup */}
      {activeUnauthorizedAlert && (
        <UnauthorizedLoginAlertModal
          alert={activeUnauthorizedAlert}
          onDismiss={() => {
            setActiveUnauthorizedAlert(null);
            checkUnauthorizedAlerts();
            onRefresh();
          }}
          onNavigateToActivity={() => setSubTab('activity')}
        />
      )}
    </div>
  );
}
