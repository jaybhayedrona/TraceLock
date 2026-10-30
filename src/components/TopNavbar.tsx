import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Settings,
  Shield,
  FileText,
  Users,
  Camera,
} from 'lucide-react';
import { User, SecurityAlert, DocumentItem } from '../types';
import { SidebarTab } from './Sidebar';

interface TopNavbarProps {
  user: User;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  alerts: SecurityAlert[];
  documents: DocumentItem[];
  onSelectTab: (tab: SidebarTab) => void;
  onOpenUpload: () => void;
  onLogout: () => void;
  onOpenDocDetails: (doc: DocumentItem) => void;
  onOpenProfileAvatar?: () => void;
}

export function TopNavbar({
  user,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  alerts,
  documents,
  onSelectTab,
  onOpenUpload,
  onLogout,
  onOpenDocDetails,
  onOpenProfileAvatar,
}: TopNavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter documents matching search query
  const matchingDocs = searchQuery.trim()
    ? documents.filter((d) =>
        d.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.sha256Baseline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 h-16 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F5F7FB] rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Document Search */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search documents by name, category, or SHA-256 hash..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#172033] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-[#4776D0] transition-all placeholder:text-[#64748B]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] bg-[#F5F7FB]">
                Matching Documents ({matchingDocs.length})
              </div>
              {matchingDocs.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#64748B]">
                  No documents found matching "{searchQuery}"
                </div>
              ) : (
                matchingDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onOpenDocDetails(doc);
                      setShowSearchResults(false);
                    }}
                    className="w-full text-left p-3 hover:bg-[#F5F7FB] flex items-center justify-between gap-2 text-xs border-b border-[#E2E8F0]/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#EEF4FC] text-[#243B6B] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-[#172033] block truncate">
                          {doc.originalFilename}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {doc.category} · {Math.round(doc.fileSize / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                        doc.verificationStatus === 'VERIFIED'
                          ? 'bg-[#ECFDF5] text-[#15966A] border border-[#A7F3D0]'
                          : doc.verificationStatus === 'MISMATCH_DETECTED'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-bold'
                          : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F5F7FB] rounded-lg transition-colors cursor-pointer"
            title="Notifications & Security Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 bg-[#F5F7FB] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#172033]">Security Alerts</span>
                <span className="font-mono text-[11px] text-[#64748B] font-semibold">
                  {unreadAlerts.length} unread
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] text-xs">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-[#64748B]">
                    <CheckCircle2 className="w-6 h-6 text-[#15966A] mx-auto mb-1" />
                    <span>No security alerts. Documents intact.</span>
                  </div>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectTab('security');
                      }}
                      className={`p-3.5 cursor-pointer hover:bg-[#F5F7FB] transition-colors flex items-start gap-3 ${
                        !a.isRead ? 'bg-[#FEF2F2]/50' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {a.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#172033] truncate">{a.title}</div>
                        <div className="text-[#64748B] text-[11px] line-clamp-2 mt-0.5 leading-relaxed">
                          {a.message}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-1 font-mono">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#F5F7FB] border-t border-[#E2E8F0] text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('security');
                  }}
                  className="text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] cursor-pointer"
                >
                  View All Security & Integrity Alerts &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5F7FB] border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover bg-white border border-[#E2E8F0] shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#243B6B] text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-bold text-[#172033] leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="block text-[10px] text-[#64748B] truncate">
                {user.familyRole ? `Family ${user.familyRole}` : user.role === 'ADMIN' ? 'Admin' : 'User'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-2 text-xs">
              <div className="p-2.5 border-b border-[#E2E8F0] flex items-center gap-2.5">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-xl object-cover bg-white border border-[#E2E8F0]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#243B6B] text-white font-bold text-sm flex items-center justify-center uppercase">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-[#172033] block truncate">{user.name}</span>
                  <span className="text-[#64748B] font-mono text-[11px] block truncate">{user.email}</span>
                </div>
              </div>

              <div className="py-1">
                {onOpenProfileAvatar && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfileAvatar();
                    }}
                    className="w-full text-left px-3 py-2 text-[#243B6B] hover:bg-[#EEF4FC] font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#4776D0]" />
                    <span>Change Profile Picture</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSelectTab('family');
                  }}
                  className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F5F7FB] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4 text-[#64748B]" />
                  <span>Family Vault Overview</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSelectTab('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F5F7FB] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#64748B]" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSelectTab('security');
                  }}
                  className="w-full text-left px-3 py-2 text-[#172033] hover:bg-[#F5F7FB] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#64748B]" />
                  <span>Security &amp; Integrity Lab</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#E2E8F0]">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
