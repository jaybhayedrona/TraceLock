/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { WelcomePage } from './components/WelcomePage';
import { AuthModal } from './components/AuthModal';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardOverview } from './components/DashboardOverview';
import { DocumentsView } from './components/DocumentsView';
import { SecurityView } from './components/SecurityView';
import { ChecklistsView } from './components/ChecklistsView';
import { SharedDocumentsView } from './components/SharedDocumentsView';
import { FamilyVaultView } from './components/FamilyVaultView';
import { ProfileAvatarModal } from './components/ProfileAvatarModal';
import { SettingsView } from './components/SettingsView';
import { CodeVaultView } from './components/CodeVaultView';
import { AuditLogModal } from './components/AuditLogModal';
import { DocumentDetailsModal } from './components/DocumentDetailsModal';
import {
  fetchCurrentUser,
  getDocuments,
  getAlerts,
  getIncidents,
  getVerificationHistory,
  getChecklists,
  getSystemHealth,
  getFaultEvents,
  getSharedDocuments,
  retryFaultEvent,
  verifyDocument,
  logoutApi,
} from './api';
import {
  User,
  DocumentItem,
  SecurityAlert,
  IntegrityIncident,
  VerificationLog,
  ChecklistItem,
  SystemHealth,
  FaultEvent,
  SharedDocument,
} from './types';
import { Activity, History, FileCode2 } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Sidebar & Navigation states
  const [currentTab, setCurrentTab] = useState<SidebarTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCodeVaultModalOpen, setIsCodeVaultModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);

  // Application Data States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [incidents, setIncidents] = useState<IntegrityIncident[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [faultEvents, setFaultEvents] = useState<FaultEvent[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Load current user session on mount
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setUser(u);
      }
    });
  }, []);

  // Fetch all live data from backend APIs
  const refreshData = useCallback(async () => {
    try {
      const [docs, alrts, incs, verifs, chks, faults, shared, health] = await Promise.all([
        getDocuments().catch(() => []),
        getAlerts().catch(() => []),
        getIncidents().catch(() => []),
        getVerificationHistory().catch(() => []),
        getChecklists().catch(() => []),
        getFaultEvents().catch(() => []),
        getSharedDocuments().catch(() => []),
        getSystemHealth().catch(() => null),
      ]);

      setDocuments(docs);
      setAlerts(alrts);
      setIncidents(incs);
      setVerifications(verifs);
      setChecklists(chks);
      setFaultEvents(faults);
      setSharedDocuments(shared);
      setSystemHealth(health);
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  }, []);

  // Periodic poll so scheduled verification results appear live
  useEffect(() => {
    if (user) {
      refreshData();
      const interval = setInterval(refreshData, 8000);
      return () => clearInterval(interval);
    }
  }, [user, refreshData]);

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setCurrentTab('dashboard');
  };

  const handleRetryFault = async (eventId: string) => {
    await retryFaultEvent(eventId);
    await refreshData();
  };

  const handleVerifyDocument = async (doc: DocumentItem) => {
    await verifyDocument(doc.id);
    await refreshData();
  };

  // 1. Splash Screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Welcome Page (Unauthenticated)
  if (!user) {
    return (
      <>
        <WelcomePage
          onGetStarted={() => {
            setAuthInitialMode('register');
            setIsAuthOpen(true);
          }}
          onSignIn={() => {
            setAuthInitialMode('login');
            setIsAuthOpen(true);
          }}
        />

        {isAuthOpen && (
          <AuthModal
            initialMode={authInitialMode}
            onSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              setIsAuthOpen(false);
              refreshData();
            }}
            onClose={() => setIsAuthOpen(false)}
          />
        )}
      </>
    );
  }

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  // 3. Main Authenticated Dashboard with Sidebar + Top Navbar Layout
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex selection:bg-[#4776D0]/20 selection:text-[#243B6B]">
      {/* 1. Left Sidebar (Fixed or Collapsible) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        unreadAlertsCount={unreadAlertsCount}
        totalDocsCount={documents.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Bar */}
        <TopNavbar
          user={user}
          onToggleSidebar={() => {
            // On mobile toggle drawer, on desktop toggle collapse
            if (window.innerWidth < 768) {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          alerts={alerts}
          documents={documents}
          onSelectTab={setCurrentTab}
          onOpenUpload={() => {
            setCurrentTab('documents');
            setIsUploadOpen(true);
          }}
          onLogout={handleLogout}
          onOpenDocDetails={(doc) => setInspectingDoc(doc)}
          onOpenProfileAvatar={() => setIsAvatarModalOpen(true)}
        />

        {/* Dynamic Main Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              user={user}
              documents={documents}
              alerts={alerts}
              incidents={incidents}
              verifications={verifications}
              faultEvents={faultEvents}
              systemHealth={systemHealth}
              onNavigate={setCurrentTab}
              onOpenUpload={() => {
                setCurrentTab('documents');
                setIsUploadOpen(true);
              }}
              onOpenDocDetails={(doc) => setInspectingDoc(doc)}
              onRetryFault={handleRetryFault}
              onVerifyDocument={handleVerifyDocument}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onRefresh={refreshData}
              isUploadOpen={isUploadOpen}
              setIsUploadOpen={setIsUploadOpen}
            />
          )}

          {currentTab === 'checklists' && (
            <ChecklistsView
              checklists={checklists}
              documents={documents}
              onRefresh={refreshData}
              onNavigateToDocuments={() => setCurrentTab('documents')}
            />
          )}

          {currentTab === 'security' && (
            <SecurityView
              user={user}
              alerts={alerts}
              incidents={incidents}
              documents={documents}
              systemHealth={systemHealth}
              onRefresh={refreshData}
            />
          )}

          {currentTab === 'family' && (
            <FamilyVaultView
              user={user}
              personalDocuments={documents}
              onRefreshData={refreshData}
              onOpenDocDetails={(doc) => setInspectingDoc(doc)}
              onUserUpdate={(updatedUser) => setUser(updatedUser)}
            />
          )}

          {currentTab === 'shared' && (
            <SharedDocumentsView
              documents={documents}
              sharedDocuments={sharedDocuments}
              onRefresh={refreshData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              systemHealth={systemHealth}
              onOpenAuditLogs={() => setIsAuditModalOpen(true)}
              onOpenCodeVault={() => setIsCodeVaultModalOpen(true)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-[#E2E8F0] mt-auto py-3 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#172033]">TraceLock Platform</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 text-[#15966A] font-medium">
                <Activity className="w-3.5 h-3.5 text-[#15966A]" />
                <span>SHA-256 Engine Online</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="text-[#243B6B] hover:text-[#4776D0] hover:underline flex items-center gap-1 font-semibold cursor-pointer transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Ledger</span>
              </button>

              <button
                onClick={() => setIsCodeVaultModalOpen(true)}
                className="text-[#243B6B] hover:text-[#4776D0] hover:underline flex items-center gap-1 font-semibold cursor-pointer transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5 text-[#4776D0]" />
                <span>Spring Boot & SQL Vault</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      {/* 1. Document Details Inspection Modal */}
      <DocumentDetailsModal
        document={inspectingDoc}
        onClose={() => setInspectingDoc(null)}
        onRefresh={refreshData}
      />

      {/* 2. Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* 3. Spring Boot Code Vault Modal */}
      {isCodeVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#243B6B] px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#1E3159]">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-4 h-4 text-[#4776D0]" />
                <h2 className="text-sm font-semibold tracking-wide">Java Spring Boot & MySQL Deliverables</h2>
              </div>
              <button
                onClick={() => setIsCodeVaultModalOpen(false)}
                className="text-white/70 hover:text-white text-xl leading-none font-medium cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <CodeVaultView />
            </div>
          </div>
        </div>
      )}

      {/* 4. Profile Picture Upload Modal */}
      {isAvatarModalOpen && user && (
        <ProfileAvatarModal
          user={user}
          onClose={() => setIsAvatarModalOpen(false)}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
