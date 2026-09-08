import React, { useState } from 'react';
import { User, Bell, Save, CheckCircle2, ShieldCheck, Calendar, MapPin, Building2 } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateSettings: (updated: Partial<UserProfile>) => Promise<void>;
}

const boardsByState: Record<string, string[]> = {
  'Tamil Nadu': ['TANGEDCO (TNEB)'],
  'Kerala': ['KSEB (Kerala State Electricity Board)'],
  'Gujarat': ['Torrent Power (Ahmedabad/Surat)', 'UGVCL (Uttar Gujarat)', 'DGVCL (Dakshin Gujarat)', 'MGVCL', 'PGVCL'],
  'Karnataka': ['BESCOM (Bengaluru)', 'MESCOM (Mangaluru)', 'HESCOM (Hubballi)', 'GESCOM (Kalaburagi)'],
  'Maharashtra': ['MSEDCL (Mahavitaran)', 'Adani Electricity Mumbai', 'Tata Power Mumbai', 'BEST Undertaking'],
  'Delhi': ['BSES Rajdhani Power Ltd', 'BSES Yamuna Power Ltd', 'Tata Power DDL'],
  'Telangana & AP': ['TSSPDCL (Hyderabad)', 'TSECL', 'APEPDCL'],
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateSettings,
}) => {
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [budgetLimit, setBudgetLimit] = useState<number>(user.budgetLimit || 2500);
  const [selectedState, setSelectedState] = useState(user.state || 'Tamil Nadu');
  const [selectedBoard, setSelectedBoard] = useState(user.board || 'TANGEDCO (TNEB)');
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Bi-Monthly'>(
    user.billingCycle || (['Tamil Nadu', 'Kerala', 'Gujarat'].includes(user.state || 'Tamil Nadu') ? 'Bi-Monthly' : 'Monthly')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const availableBoards = boardsByState[selectedState] || boardsByState['Tamil Nadu'];

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const firstBoard = boardsByState[newState]?.[0] || 'Default Board';
    setSelectedBoard(firstBoard);
    if (['Tamil Nadu', 'Kerala', 'Gujarat'].includes(newState)) {
      setBillingCycle('Bi-Monthly');
    } else {
      setBillingCycle('Monthly');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onUpdateSettings({
        name: fullName,
        email,
        budgetLimit: Number(budgetLimit),
        state: selectedState,
        board: selectedBoard,
        billingCycle,
      });
      setMessage('✅ Account settings, regional tariff, and billing cycle saved successfully.');
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your personal profile, regional tariff configuration, and smart AI budget alerts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        {/* Profile Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">👤 Profile Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Regional & Tariff Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">📍 Electricity Bill Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> State
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
              >
                {Object.keys(boardsByState).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Electricity Board
              </label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
              >
                {availableBoards.map((bd) => (
                  <option key={bd} value={bd}>
                    {bd}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as 'Monthly' | 'Bi-Monthly')}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
              >
                <option value="Bi-Monthly">Bi-Monthly (Every 2 Months)</option>
                <option value="Monthly">Monthly (Every Month)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Smart AI Alert Budget Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">🔔 Budget Alerts</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            We'll alert you when your estimated bill is higher than your budget.
          </p>

          <div className="max-w-md pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Budget (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-medium text-sm">₹</span>
              <input
                type="number"
                required
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full pl-8 pr-4 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Location & Board Display */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Your bill settings: <strong>{selectedState}</strong> · <strong>{selectedBoard}</strong> · <strong>{billingCycle}</strong></span>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Settings...' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
};
