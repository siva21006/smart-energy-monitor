import React, { useState } from 'react';
import { 
  Camera, 
  Keyboard, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  Edit3,
  Save,
  Info
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
  
  // OCR Review state
  const [scannedResult, setScannedResult] = useState<BillRecord | null>(null);
  const [isConfirmingScan, setIsConfirmingScan] = useState(false);

  // Manual Entry state
  const [units, setUnits] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [billingPeriodStart, setBillingPeriodStart] = useState<string>('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>('');
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
    setScannedResult(null);

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
        setScannedResult(data.record);
        setScanMessage(`✨ Extracted ${data.record.units} kWh units. Please review before saving.`);
      } else {
        setScanMessage('⚠️ We couldn\'t read all the details from this bill. Please check the image quality or enter manually.');
      }
    } catch (err: any) {
      setScanMessage(`Error scanning bill: ${err.message || 'Server error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmScan = async () => {
    if (!scannedResult) return;
    setIsConfirmingScan(true);
    try {
      const res = await fetch('/api/bills/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: scannedResult.units,
          amount: scannedResult.hasCustomAmount ? scannedResult.originalAmount : undefined,
          date: scannedResult.billingDate || scannedResult.scanDate,
          billingPeriodStart: scannedResult.billingPeriodStart,
          billingPeriodEnd: scannedResult.billingPeriodEnd,
        }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        onBillAdded(data.record);
        setScanMessage(`✅ Bill saved successfully!`);
        setTimeout(() => {
          onNavigateHistory();
        }, 1000);
      } else {
        console.error('Backend returned error saving scanned bill:', data);
        setScanMessage(`Failed to save bill: ${data.error || 'Server rejected request'}`);
      }
    } catch (err: any) {
      console.error('Failed to save scanned bill exception:', err);
      setScanMessage(`Failed to save bill: ${err.message || 'Network error'}`);
    } finally {
      setIsConfirmingScan(false);
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
          billingPeriodStart: billingPeriodStart || undefined,
          billingPeriodEnd: billingPeriodEnd || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        onBillAdded(data.record);
        setManualMessage(`✅ Bill saved successfully (${data.record.units} kWh).`);
        setTimeout(() => {
          onNavigateHistory();
        }, 1000);
      } else {
        console.error('Backend returned error saving manual bill:', data);
        setManualMessage(`Failed to save manual bill entry: ${data.error || 'Server rejected request'}`);
      }
    } catch (err: any) {
      console.error('Failed to save manual bill entry exception:', err);
      setManualMessage(`Failed to save manual bill entry: ${err.message || 'Network error'}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Your Electricity Bill</h1>
        <p className="text-slate-500 text-sm mt-2">
          Upload your bill or enter the details manually.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Option 1: AI OCR Upload */}
        <div className="bg-white rounded-2xl p-6 border-t-4 border-t-purple-600 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">📸 Scan Bill with AI</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  ✨ Powered by AI
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Upload a photo or PDF of your electricity bill. AI will extract the important details for you.
            </p>

            {!scannedResult ? (
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
                      <p className="text-sm font-medium text-slate-700">Upload your electricity bill</p>
                      <p className="text-xs text-slate-400">Photo, PNG, JPG, WEBP or PDF</p>
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
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <span>Scan Bill with AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Bill Details Found
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Units Consumed:</span>
                      <span className="font-bold text-slate-900">{scannedResult.units} kWh</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Billing Date:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(scannedResult.billingDate || scannedResult.scanDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Billing Period:</span>
                      <span className="font-semibold text-slate-900">{scannedResult.billingPeriod}</span>
                    </div>

                    {scannedResult.hasCustomAmount ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Bill amount on uploaded bill:</span>
                          <span className="font-bold text-slate-900">₹{scannedResult.originalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Calculated amount:</span>
                          <span className="font-bold text-emerald-600">₹{scannedResult.amount.toLocaleString('en-IN')}</span>
                        </div>
                        {scannedResult.originalAmount !== scannedResult.amount && (
                          <div className="flex items-start gap-1.5 p-2 bg-amber-50 text-amber-800 rounded-lg text-xs mt-2 border border-amber-200">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>Bill amount differs from our calculation. Please review.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500 font-medium">Calculated Bill Amount:</span>
                        <span className="font-bold text-slate-900">₹{scannedResult.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmScan}
                    disabled={isConfirmingScan}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
                  >
                    {isConfirmingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Confirm & Save Bill
                  </button>
                  <button
                    onClick={() => {
                      setUnits(scannedResult.units.toString());
                      setAmount(scannedResult.hasCustomAmount ? scannedResult.originalAmount?.toString() || '' : '');
                      setBillDate(scannedResult.billingDate || scannedResult.scanDate);
                      setScannedResult(null);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Details
                  </button>
                </div>
              </div>
            )}
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
                <h2 className="text-lg font-bold text-slate-900">⌨️ Enter Bill Details</h2>
                <span className="text-xs text-slate-500">Don't have a bill photo? Enter the details manually.</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 mt-6">
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
                  Bill Amount (₹) <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="Leave blank to calculate automatically."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Date *
                </label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm min-h-[44px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                    Period Start (Optional)
                  </label>
                  <input
                    type="date"
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                    Period End (Optional)
                  </label>
                  <input
                    type="date"
                    value={billingPeriodEnd}
                    onChange={(e) => setBillingPeriodEnd(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Calculate Bill</span>
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
