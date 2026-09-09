import React from 'react';
import { 
  Zap, 
  IndianRupee, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  BrainCircuit,
  ScanLine,
  Loader2
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
import { formatDate } from '../lib/dateUtils';

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
  const hasBills = bills.length > 0;
  const latestBill = hasBills ? bills[0] : null;
  const budgetLimit = user.budgetLimit || 2500;
  
  // Use prediction amount if available, otherwise latest bill amount, else 0.
  const projectedAmount = prediction ? prediction.predictedAmount : (latestBill ? latestBill.amount : 0);
  
  const isBudgetExceeded = projectedAmount > budgetLimit;
  const excessAmount = Math.max(0, projectedAmount - budgetLimit);
  const budgetUsagePct = budgetLimit > 0 ? Math.round((projectedAmount / budgetLimit) * 100) : 0;

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
          <span>+ Add Bill</span>
        </button>
      </div>

      {/* Prominent Red Warning Banner when Projected Cost Exceeds Budget Limit */}
      {isBudgetExceeded && hasBills && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 text-white flex-shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base tracking-tight text-white">⚠️ Budget Alert</h3>
              </div>
              <p className="text-sm text-rose-100 mt-1 leading-relaxed">
                Your estimated bill of <span className="font-extrabold text-white underline decoration-rose-300">₹{projectedAmount.toLocaleString('en-IN')}</span> is above your <span className="font-extrabold text-white">₹{budgetLimit.toLocaleString('en-IN')}</span> budget.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-extrabold text-white bg-rose-950/70 px-3 py-1.5 rounded-xl border border-rose-400/40 whitespace-nowrap shadow-sm">
              +₹{excessAmount.toLocaleString('en-IN')} Over Budget
            </span>
          </div>
        </div>
      )}

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Current Usage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold tracking-wider uppercase">Current Usage</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            {hasBills && latestBill ? (
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {latestBill.units} <span className="text-base font-normal text-slate-500">kWh</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-slate-400">No bill added</p>
            )}
          </div>
          {hasBills && latestBill && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
              Period: {latestBill.billingPeriod || 'Current'}
            </p>
          )}
        </div>

        {/* Card 2: Latest Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold tracking-wider uppercase">Latest Bill</span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            {hasBills && latestBill ? (
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ₹{latestBill.amount.toLocaleString('en-IN')}
              </p>
            ) : (
              <p className="text-xl font-bold text-slate-400">No bill yet</p>
            )}
          </div>
          {hasBills && latestBill && (
            <p className="text-xs text-slate-500 mt-2 truncate">
              Billing period: <span className="font-medium text-slate-700">{latestBill.billingPeriod || 'Current'}</span>
            </p>
          )}
        </div>

        {/* Card 3: Projected Monthly Cost */}
        <div className={`p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
          isBudgetExceeded && hasBills
            ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
                Projected Bill
              </span>
              <div className={`p-2 rounded-xl ${isBudgetExceeded && hasBills ? 'bg-rose-500 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600'}`}>
                {isBudgetExceeded && hasBills ? <AlertTriangle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
            </div>
            {hasBills ? (
              <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isBudgetExceeded ? 'text-rose-700' : 'text-slate-900'}`}>
                ₹{projectedAmount.toLocaleString('en-IN')}
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-400">Add a bill to get a prediction</p>
            )}
          </div>
          {hasBills && (
            <div className="mt-2 flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500 truncate">
                Estimated from your recent usage
              </span>
            </div>
          )}
        </div>

        {/* Card 4: Monthly Budget Target & Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Budget Target</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{budgetLimit.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-[11px] font-semibold">
              <span className={isBudgetExceeded && hasBills ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                {hasBills ? `${budgetUsagePct}% used` : '0% used'}
              </span>
              {hasBills && (
                <span className={isBudgetExceeded ? 'text-rose-600 font-bold uppercase' : 'text-slate-400'}>
                  {isBudgetExceeded ? 'Status: Over budget' : 'Status: Within budget'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${isBudgetExceeded && hasBills ? 'bg-rose-600' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, hasBills ? budgetUsagePct : 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Forecast Card */}
      {hasBills && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">AI Bill Prediction</h2>
                <p className="text-xs text-slate-500">Uses your previous electricity usage to estimate next month's consumption and bill.</p>
              </div>
            </div>
            {prediction && prediction.confidencePct > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                Prediction confidence: {prediction.confidencePct}%
              </span>
            )}
          </div>

          {prediction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estimated Usage Next Month</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    {prediction.predictedUnits} <span className="text-sm font-normal text-slate-600">units</span>
                  </p>
                </div>
                <div className={`p-3 rounded-xl border transition-all ${
                  isBudgetExceeded 
                    ? 'bg-rose-100/70 border-rose-300 text-rose-950' 
                    : 'bg-emerald-50/60 border-emerald-200/60 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Estimated Next Bill</p>
                  </div>
                  <p className={`text-2xl font-extrabold mt-0.5 ${isBudgetExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                    ₹{prediction.predictedAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 mt-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`₹${value}`, 'Amount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#059669" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-500">Generating prediction...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
