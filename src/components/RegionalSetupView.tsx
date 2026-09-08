import React, { useState } from 'react';
import { MapPin, Building2, Calendar, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface RegionalSetupViewProps {
  user: UserProfile;
  onUpdateSetup: (state: string, board: string, billingCycle?: 'Monthly' | 'Bi-Monthly') => Promise<void>;
  onNavigateDashboard: () => void;
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

export const RegionalSetupView: React.FC<RegionalSetupViewProps> = ({
  user,
  onUpdateSetup,
  onNavigateDashboard,
}) => {
  const [selectedState, setSelectedState] = useState(user.state || 'Tamil Nadu');
  const [selectedBoard, setSelectedBoard] = useState(user.board || 'TANGEDCO (TNEB)');
  const [selectedCycle, setSelectedCycle] = useState<'Monthly' | 'Bi-Monthly'>(
    user.billingCycle || (['Tamil Nadu', 'Kerala', 'Gujarat'].includes(user.state || 'Tamil Nadu') ? 'Bi-Monthly' : 'Monthly')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const availableBoards = boardsByState[selectedState] || boardsByState['Tamil Nadu'];

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const firstBoard = boardsByState[newState]?.[0] || 'Default Board';
    setSelectedBoard(firstBoard);

    // Default cycle for state
    if (['Tamil Nadu', 'Kerala', 'Gujarat'].includes(newState)) {
      setSelectedCycle('Bi-Monthly');
    } else {
      setSelectedCycle('Monthly');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onUpdateSetup(selectedState, selectedBoard, selectedCycle);
      setMessage('✅ Location, board and billing cycle updated successfully.');
      setTimeout(() => {
        onNavigateDashboard();
      }, 1000);
    } catch (err) {
      setMessage('Failed to update regional setup.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 animate-fade-in space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-emerald-200">
            📍
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Electricity Details</h2>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Select your Indian State, DISCOM Electricity Board, and Billing Cycle for precise tariff slab calculations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* State Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Select State *
            </label>
            <select
              required
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
            >
              {Object.keys(boardsByState).map((st) => (
                <option key={st} value={st}>
                  {st} {['Tamil Nadu', 'Kerala', 'Gujarat'].includes(st) ? ' (Bi-Monthly Standard)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Board Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Electricity Board (DISCOM) *
            </label>
            <select
              required
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
            >
              {availableBoards.map((bd) => (
                <option key={bd} value={bd}>
                  {bd}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Billing Cycle *
            </label>
            <select
              required
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value as 'Monthly' | 'Bi-Monthly')}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm"
            >
              <option value="Bi-Monthly">Every 2 months</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Tariff Info Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
            <p className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Bill calculation is configured for your selected electricity board.
            </p>
            <details className="mt-2 group">
              <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-semibold select-none inline-flex items-center gap-1">
                View tariff details
              </summary>
              <div className="mt-3 pl-1 space-y-1.5 border-l-2 border-emerald-100">
                {selectedState.includes('Tamil Nadu') && (
                  <p>• TANGEDCO 2-month cycle: 0-100 units free (subsidy) | 101-200: ₹4.50 | 201-400: ₹6.00 | 401-500: ₹8.00 | &gt;500: ₹9.00/unit</p>
                )}
                {selectedState.includes('Kerala') && (
                  <p>• KSEB 2-month cycle: 0-100: ₹3.25 | 101-200: ₹4.05 | 201-300: ₹5.10 | 301-400: ₹6.90 | &gt;500: ₹8.50/unit</p>
                )}
                {selectedState.includes('Gujarat') && (
                  <p>• Torrent/GUVNL 2-month cycle: 0-100: ₹3.05 | 101-250: ₹3.50 | &gt;250: ₹5.20/unit</p>
                )}
                {selectedState.includes('Karnataka') && (
                  <p>• BESCOM Monthly: 0-50 units: ₹4.15 | 51-100: ₹5.60 | &gt;100: ₹7.15/unit (Gruha Jyoti applicable if eligible)</p>
                )}
                {selectedState.includes('Maharashtra') && (
                  <p>• MSEDCL Monthly: 0-100 units: ₹3.46 | 101-300: ₹7.43 | 301-500: ₹10.32 | &gt;500: ₹11.71/unit</p>
                )}
                {selectedState.includes('Delhi') && (
                  <p>• BSES/Tata Monthly: 0-200 units free (subsidy) | 201-400: ₹4.50 | 401-800: ₹6.50 | &gt;800: ₹7.00/unit</p>
                )}
                {!['Tamil Nadu', 'Kerala', 'Gujarat', 'Karnataka', 'Maharashtra', 'Delhi'].some((s) => selectedState.includes(s)) && (
                  <p>• National Average Tariff Fallback applied for {selectedState}. Exact state slab rules will be updated soon.</p>
                )}
              </div>
            </details>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>{isSaving ? 'Updating Tariff Slabs...' : 'Continue to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
