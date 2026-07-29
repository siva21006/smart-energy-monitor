import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { UploadBillView } from './components/UploadBillView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { RegionalSetupView } from './components/RegionalSetupView';
import { AuthView } from './components/AuthView';
import { UserProfile, BillRecord, PredictionResult, GeminiInsight } from './types';
import { Zap, Menu, LayoutDashboard, ScanLine, History, Settings, MapPin } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    state: 'Tamil Nadu',
    board: 'TANGEDCO (TNEB)',
    budgetLimit: 2500,
  });

  const [bills, setBills] = useState<BillRecord[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [insight, setInsight] = useState<GeminiInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);

  // Fetch initial backend state
  const fetchAllData = async () => {
    try {
      // 1. Fetch User
      const userRes = await fetch('/api/user');
      const userData = await userRes.json();
      if (userData.user) setUser(userData.user);

      // 2. Fetch Bills
      const billsRes = await fetch('/api/bills');
      const billsData = await billsRes.json();
      if (billsData.records) setBills(billsData.records);

      // 3. Fetch Forecast
      const forecastRes = await fetch('/api/forecast');
      const forecastData = await forecastRes.json();
      if (forecastData.prediction) setPrediction(forecastData.prediction);

      // 4. Fetch Insights
      setIsLoadingInsight(true);
      const insightRes = await fetch('/api/insights');
      const insightData = await insightRes.json();
      if (insightData.insight) setInsight(insightData.insight);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const handleBillAdded = (newBill: BillRecord) => {
    setBills((prev) => [newBill, ...prev]);
    // Refresh forecast & insights
    fetch('/api/forecast')
      .then((r) => r.json())
      .then((d) => d.prediction && setPrediction(d.prediction));
  };

  const handleDeleteBill = async (id: string) => {
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      setBills((prev) => prev.filter((b) => b.id !== id));
      // Refresh forecast
      const forecastRes = await fetch('/api/forecast');
      const forecastData = await forecastRes.json();
      if (forecastData.prediction) setPrediction(forecastData.prediction);
    } catch (err) {
      console.error('Error deleting bill:', err);
    }
  };

  const handleResetHistory = async () => {
    try {
      const res = await fetch('/api/bills/reset', { method: 'POST' });
      const data = await res.json();
      if (data.records) setBills(data.records);
      fetchAllData();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleUpdateSetup = async (state: string, board: string, billingCycle?: 'Monthly' | 'Bi-Monthly') => {
    const res = await fetch('/api/user/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, board, billingCycle }),
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      fetchAllData();
    }
  };

  const handleUpdateSettings = async (updated: Partial<UserProfile>) => {
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: updated.name,
        email: updated.email,
        budget_limit: updated.budgetLimit,
        state: updated.state,
        board: updated.board,
        billingCycle: updated.billingCycle,
      }),
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      fetchAllData();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setBills([]);
    setPrediction(null);
    setInsight(null);
  };

  if (!isAuthenticated) {
    return <AuthView onAuthSuccess={(u) => { setUser(u); setIsAuthenticated(true); }} />;
  }

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Scan Bill', icon: ScanLine },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white leading-tight">EnergyApp</h1>
            <p className="text-[10px] text-emerald-400 font-medium truncate max-w-[150px]">
              {user.state} ({user.billingCycle || 'Bi-Monthly'})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar / Mobile Drawer Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userEmail={user.email}
        userName={user.name}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto min-w-0">
        {currentTab === 'dashboard' && (
          <DashboardView
            user={user}
            bills={bills}
            prediction={prediction}
            insight={insight}
            isLoadingInsight={isLoadingInsight}
            onNavigateUpload={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'upload' && (
          <UploadBillView
            onBillAdded={handleBillAdded}
            onNavigateHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            user={user}
            records={bills}
            prediction={prediction}
            onNavigateUpload={() => setCurrentTab('upload')}
            onDeleteRecord={handleDeleteBill}
            onResetHistory={handleResetHistory}
          />
        )}

        {currentTab === 'setup' && (
          <RegionalSetupView
            user={user}
            onUpdateSetup={handleUpdateSetup}
            onNavigateDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            user={user}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 text-slate-400 px-2 py-1.5 flex justify-around items-center shadow-2xl">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[60px] ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

