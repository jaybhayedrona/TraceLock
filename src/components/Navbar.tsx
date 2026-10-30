import { Logo } from './Logo';
import { User } from '../types';

export type NavTab = 'dashboard' | 'documents' | 'alerts' | 'testlab' | 'checklists' | 'codevault';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadAlertCount: number;
  user: User | null;
  onOpenUpload: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentTab,
  onSelectTab,
  unreadAlertCount,
  user,
  onOpenUpload,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="cursor-pointer shrink-0"
        >
          <Logo size={34} />
        </div>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] ${
              currentTab === 'dashboard'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('documents')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] ${
              currentTab === 'documents'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            Documents
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] relative flex items-center gap-1.5 ${
              currentTab === 'alerts'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            <span>Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="font-mono text-xs font-bold text-rose-600 tabular-nums">
                ({unreadAlertCount})
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('testlab')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] ${
              currentTab === 'testlab'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            Integrity Test Lab
          </button>

          <button
            onClick={() => onSelectTab('checklists')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] ${
              currentTab === 'checklists'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            Checklists
          </button>

          <button
            onClick={() => onSelectTab('codevault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-[#243B6B] ${
              currentTab === 'codevault'
                ? 'text-[#243B6B] font-semibold border-b-2 border-[#243B6B]'
                : ''
            }`}
          >
            Spring & SQL Vault
          </button>
        </nav>

        {/* Zone 3: Primary Action & Session */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] shadow-xs rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>+ Upload Document</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="hidden lg:inline text-xs font-medium text-slate-700 truncate max-w-[120px]">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors py-1 px-1.5 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 bg-slate-50/70 text-xs overflow-x-auto">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2 py-1 whitespace-nowrap ${currentTab === 'dashboard' ? 'font-bold text-[#243B6B]' : 'text-slate-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('documents')}
          className={`px-2 py-1 whitespace-nowrap ${currentTab === 'documents' ? 'font-bold text-[#243B6B]' : 'text-slate-600'}`}
        >
          Documents
        </button>
        <button
          onClick={() => onSelectTab('alerts')}
          className={`px-2 py-1 whitespace-nowrap ${currentTab === 'alerts' ? 'font-bold text-[#243B6B]' : 'text-slate-600'}`}
        >
          Alerts {unreadAlertCount > 0 ? `(${unreadAlertCount})` : ''}
        </button>
        <button
          onClick={() => onSelectTab('testlab')}
          className={`px-2 py-1 whitespace-nowrap ${currentTab === 'testlab' ? 'font-bold text-[#243B6B]' : 'text-slate-600'}`}
        >
          Test Lab
        </button>
        <button
          onClick={() => onSelectTab('codevault')}
          className={`px-2 py-1 whitespace-nowrap ${currentTab === 'codevault' ? 'font-bold text-[#243B6B]' : 'text-slate-600'}`}
        >
          Spring Vault
        </button>
      </div>
    </header>
  );
}
