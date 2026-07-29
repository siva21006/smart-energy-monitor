import React, { useState } from 'react';
import { 
  Camera, 
  Keyboard, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText,
  Loader2
} from 'lucide-react';
import { BillRecord } from '../types';

interface UploadBillViewProps {
  onBillAdded: (bill: BillRecord) => void;
  onNavigateHistory: () => void;
}

export const UploadBillView: React.FC<UploadBillViewProps> = ({
  onBillAdded,
  onNavigateHistory,
}) => {
  // OCR Scan state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Manual Entry state
  const [units, setUnits] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setScanMessage('Please select an image file first.');
      return;
    }

    setIsScanning(true);
    setScanMessage(null);

    try {
      let base64Data = '';
      if (selectedFile) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const res = await fetch('/api/bills/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedFile?.type || 'image/png',
        }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        onBillAdded(data.record);
        setScanMessage(`✅ Gemini Vision extracted ${data.record.units} kWh units (Total: ₹${data.record.amount}).`);
        setTimeout(() => {
          onNavigateHistory();
        }, 1200);
      } else {
        setScanMessage('⚠️ OCR Scan failed. Please check image quality.');
      }
    } catch (err: any) {
      setScanMessage(`Error scanning bill: ${err.message || 'Server error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSampleOcr = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/bills/sample-ocr', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.record) {
        onBillAdded(data.record);
        setScanMessage(`✨ Sample Bill OCR extracted ${data.record.units} kWh units (₹${data.record.amount}).`);
        setTimeout(() => {
          onNavigateHistory();
        }, 1200);
      }
    } catch (err: any) {
      setScanMessage('Sample OCR failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!units || Number(units) <= 0) {
      setManualMessage('Please enter valid units consumed.');
      return;
    }

    setIsSavingManual(true);
    setManualMessage(null);

    try {
      const res = await fetch('/api/bills/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: Number(units),
          amount: amount ? Number(amount) : undefined,
          date: billDate,
        }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        onBillAdded(data.record);
        setManualMessage(`✅ Bill saved successfully (${data.record.units} kWh).`);
        setTimeout(() => {
          onNavigateHistory();
        }, 1000);
      }
    } catch (err: any) {
      setManualMessage('Failed to save manual bill entry.');
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Ingestion Gateway</h1>
        <p className="text-slate-500 text-sm mt-2">
          Choose how you want to input your latest electricity bill data. Scan using Gemini OCR or enter values manually.
        </p>
      </header>

      {/* 2 Main Input Cards Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Option 1: AI OCR Upload */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-t-purple-600 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">📸 Smart AI Scan</h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  <Sparkles className="w-3 h-3" /> Gemini 3.6 Flash
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Upload a photo or PDF of your electricity bill. Gemini AI will automatically extract consumed units, bill date, and payable amount.
            </p>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer relative min-h-[140px] flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Bill Preview" className="max-h-36 mx-auto rounded-lg shadow-sm border" />
                    <p className="text-xs text-slate-600 font-medium">{selectedFile?.name || 'Selected Image'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-700">Tap to take photo or choose file</p>
                    <p className="text-xs text-slate-400">Supports Camera capture, PNG, JPG, WEBP, PDF</p>
                  </div>
                )}
              </div>

              {scanMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  scanMessage.includes('✅') || scanMessage.includes('✨')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{scanMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isScanning}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm min-h-[48px]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Gemini OCR...</span>
                  </>
                ) : (
                  <>
                    <span>Run Gemini OCR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Option 2: Manual Data Entry */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-t-emerald-500 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">⌨️ Manual Entry</h2>
                <span className="text-xs text-slate-500">Direct Meter / Digital Bill Input</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Don't have a photo? Manually input the kWh units from your physical meter or digital bill SMS.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Consumed (kWh) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  placeholder="e.g. 250"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Payable Amount (₹) <span className="font-normal text-slate-400">(Optional - Auto Calculated)</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="e.g. 1450.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Date
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
                />
              </div>

              {manualMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  manualMessage.includes('✅')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{manualMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingManual}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
              >
                {isSavingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Calculate Tariff</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
