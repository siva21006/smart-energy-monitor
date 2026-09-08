import React from 'react';
import { 
  Download, 
  ScanLine, 
  RotateCcw, 
  Trash2, 
  FileText, 
  TrendingUp, 
  IndianRupee, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { BillRecord, UserProfile, PredictionResult } from '../types';
import { generatePdfReport } from '../lib/pdfReportGenerator';
import { formatDate } from '../lib/dateUtils';

interface HistoryViewProps {
  user: UserProfile;
  records: BillRecord[];
  prediction: PredictionResult | null;
  onNavigateUpload: () => void;
  onDeleteRecord: (id: string) => void;
  onResetHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  user,
  records,
  prediction,
  onNavigateUpload,
  onDeleteRecord,
  onResetHistory,
}) => {
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const totalUnits = records.reduce((sum, r) => sum + r.units, 0);
  const avgUnits = records.length > 0 ? Math.round(totalUnits / records.length) : 0;

  const handleDownloadPdf = () => {
    generatePdfReport(user, records, prediction);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Usage History</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            View your previous electricity bills and usage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer text-sm min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onNavigateUpload}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer text-sm min-h-[44px]"
          >
            <ScanLine className="w-4 h-4" />
            <span>+ Scan Bill</span>
          </button>

          <button
            onClick={onResetHistory}
            title="Clear all recorded bill history"
            className="inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium px-3 py-2.5 rounded-xl border border-rose-200 text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Bills Added</p>
            <p className="text-2xl font-bold text-slate-900">{records.length} Bills</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Average Monthly Usage</p>
            <p className="text-2xl font-bold text-emerald-600">{avgUnits} kWh / mo</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Amount</p>
            <p className="text-2xl font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Bill History</h3>
          <span className="text-xs text-slate-500">{records.length} bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                <th className="p-4">Date</th>
                <th className="p-4">Billing Period</th>
                <th className="p-4">Units (kWh)</th>
                <th className="p-4">Billed Amount (₹)</th>
                <th className="p-4">Tariff Slab Tier</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{formatDate(record.billingDate || record.scanDate)}</td>
                    <td className="p-4 text-slate-600">{record.billingPeriod || 'Monthly'}</td>
                    <td className="p-4 font-bold text-emerald-700">{record.units} kWh</td>
                    <td className="p-4 font-semibold text-slate-900">₹{record.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{record.tariffSlab}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        title="Delete bill record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No bills added yet. Use the Add Bill tool to add your first bill!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
