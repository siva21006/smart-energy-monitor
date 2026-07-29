import React from 'react';
import { 
  Zap, 
  IndianRupee, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Lightbulb, 
  ArrowUpRight,
  ScanLine,
  BarChart3,
  BrainCircuit
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { BillRecord, UserProfile, PredictionResult, GeminiInsight } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  bills: BillRecord[];
  prediction: PredictionResult | null;
  insight: GeminiInsight | null;
  isLoadingInsight: boolean;
  onNavigateUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  bills,
  prediction,
  insight,
  isLoadingInsight,
  onNavigateUpload,
}) => {
  const latestBill = bills[0] || { units: 0, amount: 0, tariffSlab: 'Standard' };
  const budgetLimit = user.budgetLimit || 2500;

  // Chart dataset with forecast
  const chartData = prediction?.monthlyHistory || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Energy Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time energy tracking for <span className="font-semibold text-emerald-600">{user.state} ({user.board})</span> • <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{user.billingCycle || 'Bi-Monthly'} Cycle</span>
          </p>
        </div>
        <button
          onClick={onNavigateUpload}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm"
        >
          <ScanLine className="w-4 h-4" />
          <span>+ Scan Electricity Bill</span>
        </button>
      </div>

      {/* 3 Core Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Current Usage */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Current Monthly Usage</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {latestBill.units} <span className="text-lg font-normal text-slate-500">kWh</span>
          </p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Last Logged Period: {latestBill.billingPeriod || 'Current'}
          </p>
        </div>

        {/* Card 2: Estimated Bill */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Estimated Billed Amount</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{latestBill.amount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-2 truncate">
            Slab: <span className="font-medium text-slate-700">{latestBill.tariffSlab}</span>
          </p>
        </div>

        {/* Card 3: System Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">System Status</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>All Normal</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              🟢 Active
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Tariff Engine Synchronized with {user.board}
          </p>
        </div>
      </div>

      {/* AI Scikit-Learn Forecast Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scikit-Learn AI Forecast Engine</h2>
              <p className="text-xs text-slate-500">Linear regression model analyzing historical energy trends</p>
            </div>
          </div>
          {prediction && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              {prediction.confidencePct}% Model Confidence
            </span>
          )}
        </div>

        {prediction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Predicted Usage Next Month</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {prediction.predictedUnits} <span className="text-sm font-normal text-slate-600">units</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Forecasted Payable Cost</p>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                  ₹{prediction.predictedAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Smart Budget Warning Logic */}
            {prediction.predictedAmount > budgetLimit ? (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl text-rose-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">⚠️ Budget Exceeded Warning</h4>
                    <p className="text-xs text-rose-700 mt-1">
                      Your forecasted bill (₹{prediction.predictedAmount.toLocaleString('en-IN')}) is higher than your monthly target of ₹{budgetLimit.toLocaleString('en-IN')}. Consider optimizing cooling and peak load!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl text-emerald-900">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✅ On track! Forecasted bill (₹{prediction.predictedAmount.toLocaleString('en-IN')}) stays safely under your ₹{budgetLimit.toLocaleString('en-IN')} budget limit.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Gathering historical data points to generate prediction...</p>
        )}
      </div>

      {/* Gemini AI Insight Card */}
      <div className="bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✨ Gemini AI Smart Energy Insight
              </h3>
              <p className="text-xs text-sky-200">Server-side Generative Intelligence for Tariff Optimization</p>
            </div>
          </div>
          {insight?.estimatedSavings && (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-sky-500/20 text-sky-300 text-xs font-medium rounded-full border border-sky-400/30">
              Potential Savings: {insight.estimatedSavings}
            </span>
          )}
        </div>

        {isLoadingInsight ? (
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-4 bg-sky-800/50 rounded w-3/4"></div>
            <div className="h-4 bg-sky-800/50 rounded w-1/2"></div>
          </div>
        ) : insight ? (
          <div className="space-y-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              {insight.summary}
            </p>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
              <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Recommended Action Items
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                {insight.actionPoints?.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Unable to generate insight at this moment.</p>
        )}
      </div>

      {/* Energy Usage Timeline Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Energy Usage Timeline & AI Forecast
            </h3>
            <p className="text-xs text-slate-500">Historical kWh consumption versus projected AI forecast</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                formatter={(value: any, name: any) => [`${value} kWh`, name === 'units' ? 'Consumption' : name]}
              />
              <Line 
                type="monotone" 
                dataKey="units" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
