export interface UserProfile {
  id: string;
  email: string;
  name: string;
  state: string;
  board: string;
  billingCycle?: 'Monthly' | 'Bi-Monthly';
  budgetLimit: number;
}

export interface BillBreakdown {
  energyCharge: number;
  fixedCharges: number;
  taxAndDuty: number;
}

export interface BillRecord {
  id: string;
  userId: string;
  scanDate: string;
  billingPeriod: string;
  billingCycle?: 'Monthly' | 'Bi-Monthly';
  units: number;
  amount: number;
  isManual: boolean;
  hasCustomAmount?: boolean;
  originalAmount?: number;
  status: 'Processed' | 'Pending';
  tariffSlab: string;
  meterNumber?: string;
  breakdown: BillBreakdown;
  rawNotes?: string;
}

export interface MonthlyChartData {
  month: string;
  units: number;
  amount: number;
  isForecast?: boolean;
}

export interface PredictionResult {
  predictedUnits: number;
  predictedAmount: number;
  trend: 'up' | 'down' | 'stable';
  confidencePct: number;
  budgetExceeded: boolean;
  budgetLimit: number;
  monthlyHistory: MonthlyChartData[];
}

export interface GeminiInsight {
  title: string;
  summary: string;
  actionPoints: string[];
  anomalyAlert?: string;
  estimatedSavings: string;
  peakUsageAdvice: string;
}

export interface StateBoardOption {
  state: string;
  boards: string[];
}
