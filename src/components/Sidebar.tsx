import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  ScanLine, 
  History, 
  Settings, 
  MapPin, 
  LogOut,
  Sparkles,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userEmail: string;
  userName: string;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userEmail,
  userName,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Add Bill', icon: ScanLine },
    { id: 'history', label: 'Usage History', icon: History },
    { id: 'setup', label: 'Electricity Details', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Desktop Sidebar + Mobile Drawer) */}
      <aside 
        className={`bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shadow-xl border-r border-slate-800 transition-transform duration-300 ease-in-out z-50
          fixed inset-y-0 left-0 w-72 md:static md:w-64 md:min-h-screen md:translate-x-0 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 shadow-inner">
                <Zap className="w-6 h-6 fill-emerald-400" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-wide text-white">EnergyApp</h1>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Energy Monitor
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 md:py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-100 truncate">{userName || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{userEmail || 'admin@energyapp.local'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors duration-200 cursor-pointer min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

