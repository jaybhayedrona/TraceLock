import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  ShieldCheck,
  Share2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';

export type SidebarTab =
  | 'dashboard'
  | 'documents'
  | 'checklists'
  | 'security'
  | 'family'
  | 'shared'
  | 'settings';

interface SidebarProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  user: User;
  onLogout: () => void;
  unreadAlertsCount: number;
  totalDocsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  unreadAlertsCount,
  totalDocsCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as SidebarTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'documents' as SidebarTab,
      label: 'Document Library',
      icon: FileText,
      badge: totalDocsCount > 0 ? String(totalDocsCount) : undefined,
    },
    {
      id: 'checklists' as SidebarTab,
      label: 'Compliance Checklist',
      icon: ClipboardList,
    },
    {
      id: 'security' as SidebarTab,
      label: 'Security & Integrity',
      icon: ShieldCheck,
      badge: unreadAlertsCount > 0 ? String(unreadAlertsCount) : undefined,
      badgeColor: 'bg-[#DC2626] text-white',
    },
    {
      id: 'family' as SidebarTab,
      label: 'Family Vault',
      icon: Users,
    },
    {
      id: 'shared' as SidebarTab,
      label: 'Shared Links',
      icon: Share2,
    },
    {
      id: 'settings' as SidebarTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleTabClick = (tab: SidebarTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#243B6B] text-white select-none">
      {/* Top Header: Logo, Name & Tagline */}
      <div className="p-4 border-b border-[#1A2C52] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size={36} showText={false} />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white leading-tight truncate">
                  TraceLock
                </span>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide truncate">
                  Enterprise Document Integrity
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-[#4776D0] text-white shadow-sm font-semibold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {/* Highlight bar when active */}
              {isActive && !isCollapsed && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                }`}
              />

              {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

              {!isCollapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                    item.badgeColor || 'bg-white/20 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section: User Profile & Role */}
      <div className="p-3 border-t border-[#1A2C52] shrink-0 bg-[#1A2C52]/50">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/20 shadow-xs bg-white/10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#4776D0] text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            )}

            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-300 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#15966A]"></span>
                  <span className="uppercase tracking-wider font-semibold">
                    {user.role === 'ADMIN' ? 'Administrator' : 'Verified User'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 border-r border-[#1A2C52] sticky top-0 h-screen z-30 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
