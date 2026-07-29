import { BillBreakdown, PredictionResult, MonthlyChartData } from '../types';

export interface TariffCalculationResult {
  amount: number;
  tariffSlab: string;
  breakdown: BillBreakdown;
}

export function calculateTariff(
  units: number,
  state: string,
  board: string,
  billingCycle?: 'Monthly' | 'Bi-Monthly'
): TariffCalculationResult {
  let energyCharge = 0;
  let fixedCharge = 0;
  let taxRate = 0.05;
  let slabText = '';

  const safeUnits = Math.max(0, Number(units) || 0);
  const cleanState = (state || 'Tamil Nadu').trim();

  // Determine standard default billing cycle for state if unspecified
  const isBiMonthlyState = ['Tamil Nadu', 'Kerala', 'Gujarat', 'Punjab'].some((s) => cleanState.includes(s));
  const effectiveCycle = billingCycle || (isBiMonthlyState ? 'Bi-Monthly' : 'Monthly');

  if (cleanState.includes('Tamil Nadu')) {
    // TANGEDCO / TNEB LT-1A Domestic Tariff (Bi-Monthly Standard)
    const biMonthlyUnits = effectiveCycle === 'Bi-Monthly' ? safeUnits : safeUnits * 2;
    taxRate = 0.05;

    let biEnergy = 0;
    let biFixed = 0;

    if (biMonthlyUnits <= 100) {
      biEnergy = 0;
      slabText = `0-100 Units (${effectiveCycle}: Free Subsidy)`;
      biFixed = 0;
    } else if (biMonthlyUnits <= 200) {
      biEnergy = (biMonthlyUnits - 100) * 4.5;
      slabText = `101-200 Units (${effectiveCycle}: ₹4.50/kWh)`;
      biFixed = 0;
    } else if (biMonthlyUnits <= 400) {
      biEnergy = 100 * 4.5 + (biMonthlyUnits - 200) * 6.0;
      slabText = `201-400 Units (${effectiveCycle}: ₹6.00/kWh)`;
      biFixed = 0;
    } else if (biMonthlyUnits <= 500) {
      biEnergy = 100 * 4.5 + 200 * 6.0 + (biMonthlyUnits - 400) * 8.0;
      slabText = `401-500 Units (${effectiveCycle}: ₹8.00/kWh)`;
      biFixed = 0;
    } else if (biMonthlyUnits <= 600) {
      biEnergy = 100 * 4.5 + 200 * 6.0 + 100 * 8.0 + (biMonthlyUnits - 500) * 9.0;
      slabText = `501-600 Units (${effectiveCycle}: ₹9.00/kWh)`;
      biFixed = 50;
    } else if (biMonthlyUnits <= 800) {
      biEnergy = 100 * 4.5 + 200 * 6.0 + 100 * 8.0 + 100 * 9.0 + (biMonthlyUnits - 600) * 10.0;
      slabText = `601-800 Units (${effectiveCycle}: ₹10.00/kWh)`;
      biFixed = 50;
    } else {
      biEnergy = 100 * 4.5 + 200 * 6.0 + 100 * 8.0 + 100 * 9.0 + 200 * 10.0 + (biMonthlyUnits - 800) * 11.0;
      slabText = `800+ Units High Tier (${effectiveCycle}: ₹11.00/kWh)`;
      biFixed = 50;
    }

    if (effectiveCycle === 'Bi-Monthly') {
      energyCharge = biEnergy;
      fixedCharge = biFixed;
    } else {
      energyCharge = biEnergy / 2;
      fixedCharge = biFixed / 2;
    }
  } else if (cleanState.includes('Kerala')) {
    // KSEB Domestic Tariff (Bi-Monthly Standard)
    const biMonthlyUnits = effectiveCycle === 'Bi-Monthly' ? safeUnits : safeUnits * 2;
    taxRate = 0.10;

    let biEnergy = 0;
    let biFixed = biMonthlyUnits <= 300 ? 70 : 120;

    if (biMonthlyUnits <= 100) {
      biEnergy = biMonthlyUnits * 3.25;
      slabText = `0-100 Units (${effectiveCycle}: ₹3.25/kWh)`;
    } else if (biMonthlyUnits <= 200) {
      biEnergy = 100 * 3.25 + (biMonthlyUnits - 100) * 4.05;
      slabText = `101-200 Units (${effectiveCycle}: ₹4.05/kWh)`;
    } else if (biMonthlyUnits <= 300) {
      biEnergy = 100 * 3.25 + 100 * 4.05 + (biMonthlyUnits - 200) * 5.10;
      slabText = `201-300 Units (${effectiveCycle}: ₹5.10/kWh)`;
    } else if (biMonthlyUnits <= 400) {
      biEnergy = 100 * 3.25 + 100 * 4.05 + 100 * 5.10 + (biMonthlyUnits - 300) * 6.90;
      slabText = `301-400 Units (${effectiveCycle}: ₹6.90/kWh)`;
    } else if (biMonthlyUnits <= 500) {
      biEnergy = 100 * 3.25 + 100 * 4.05 + 100 * 5.10 + 100 * 6.90 + (biMonthlyUnits - 400) * 7.80;
      slabText = `401-500 Units (${effectiveCycle}: ₹7.80/kWh)`;
    } else {
      biEnergy = biMonthlyUnits * 8.50;
      slabText = `500+ Units High Tier (${effectiveCycle}: Flat ₹8.50/kWh)`;
    }

    if (effectiveCycle === 'Bi-Monthly') {
      energyCharge = biEnergy;
      fixedCharge = biFixed;
    } else {
      energyCharge = biEnergy / 2;
      fixedCharge = biFixed / 2;
    }
  } else if (cleanState.includes('Gujarat')) {
    // GUVNL / Torrent (Bi-Monthly Standard)
    const biMonthlyUnits = effectiveCycle === 'Bi-Monthly' ? safeUnits : safeUnits * 2;
    taxRate = 0.15;

    let biEnergy = 0;
    let biFixed = 140;

    if (biMonthlyUnits <= 100) {
      biEnergy = biMonthlyUnits * 3.05;
      slabText = `0-100 Units (${effectiveCycle}: ₹3.05/kWh)`;
    } else if (biMonthlyUnits <= 250) {
      biEnergy = 100 * 3.05 + (biMonthlyUnits - 100) * 3.50;
      slabText = `101-250 Units (${effectiveCycle}: ₹3.50/kWh)`;
    } else {
      biEnergy = 100 * 3.05 + 150 * 3.50 + (biMonthlyUnits - 250) * 5.20;
      slabText = `250+ Units (${effectiveCycle}: ₹5.20/kWh)`;
    }

    if (effectiveCycle === 'Bi-Monthly') {
      energyCharge = biEnergy;
      fixedCharge = biFixed;
    } else {
      energyCharge = biEnergy / 2;
      fixedCharge = biFixed / 2;
    }
  } else if (cleanState.includes('Karnataka')) {
    // BESCOM Tariff (Monthly Standard)
    const monthlyUnits = effectiveCycle === 'Monthly' ? safeUnits : safeUnits / 2;
    taxRate = 0.09;

    let mEnergy = 0;
    let mFixed = 110;

    if (monthlyUnits <= 100) {
      mEnergy = monthlyUnits * 4.75;
      slabText = `0-100 Units (${effectiveCycle}: ₹4.75/kWh)`;
    } else if (monthlyUnits <= 200) {
      mEnergy = 100 * 4.75 + (monthlyUnits - 100) * 7.00;
      slabText = `101-200 Units (${effectiveCycle}: ₹7.00/kWh)`;
    } else {
      mEnergy = 100 * 4.75 + 100 * 7.00 + (monthlyUnits - 200) * 9.00;
      slabText = `200+ Units Peak Tier (${effectiveCycle}: ₹9.00/kWh)`;
    }

    if (effectiveCycle === 'Monthly') {
      energyCharge = mEnergy;
      fixedCharge = mFixed;
    } else {
      energyCharge = mEnergy * 2;
      fixedCharge = mFixed * 2;
    }
  } else if (cleanState.includes('Maharashtra')) {
    // MSEDCL Tariff (Monthly Standard)
    const monthlyUnits = effectiveCycle === 'Monthly' ? safeUnits : safeUnits / 2;
    taxRate = 0.16;

    let mEnergy = 0;
    let mFixed = 128;

    if (monthlyUnits <= 100) {
      mEnergy = monthlyUnits * 5.50;
      slabText = `0-100 Units (${effectiveCycle}: ₹5.50/kWh)`;
    } else if (monthlyUnits <= 300) {
      mEnergy = 100 * 5.50 + (monthlyUnits - 100) * 9.00;
      slabText = `101-300 Units (${effectiveCycle}: ₹9.00/kWh)`;
    } else if (monthlyUnits <= 500) {
      mEnergy = 100 * 5.50 + 200 * 9.00 + (monthlyUnits - 300) * 12.00;
      slabText = `301-500 Units (${effectiveCycle}: ₹12.00/kWh)`;
    } else {
      mEnergy = 100 * 5.50 + 200 * 9.00 + 200 * 12.00 + (monthlyUnits - 500) * 14.00;
      slabText = `500+ Units Heavy Use (${effectiveCycle}: ₹14.00/kWh)`;
    }

    if (effectiveCycle === 'Monthly') {
      energyCharge = mEnergy;
      fixedCharge = mFixed;
    } else {
      energyCharge = mEnergy * 2;
      fixedCharge = mFixed * 2;
    }
  } else if (cleanState.includes('Delhi')) {
    // BSES Delhi (Monthly Standard)
    const monthlyUnits = effectiveCycle === 'Monthly' ? safeUnits : safeUnits / 2;
    taxRate = 0.05;

    let mEnergy = 0;
    let mFixed = 125;

    if (monthlyUnits <= 200) {
      mEnergy = 0;
      slabText = `0-200 Units (${effectiveCycle}: 100% Govt Subsidy Free)`;
    } else if (monthlyUnits <= 400) {
      mEnergy = (monthlyUnits - 200) * 4.50;
      slabText = `201-400 Units (${effectiveCycle}: Subsidized ₹4.50/kWh)`;
    } else if (monthlyUnits <= 800) {
      mEnergy = 200 * 4.50 + (monthlyUnits - 400) * 6.50;
      slabText = `401-800 Units (${effectiveCycle}: ₹6.50/kWh)`;
    } else {
      mEnergy = 200 * 4.50 + 400 * 6.50 + (monthlyUnits - 800) * 8.00;
      slabText = `800+ Units High Tier (${effectiveCycle}: ₹8.00/kWh)`;
    }

    if (effectiveCycle === 'Monthly') {
      energyCharge = mEnergy;
      fixedCharge = mFixed;
    } else {
      energyCharge = mEnergy * 2;
      fixedCharge = mFixed * 2;
    }
  } else if (cleanState.includes('Telangana') || cleanState.includes('AP')) {
    // TSSPDCL / APEPDCL (Monthly Standard)
    const monthlyUnits = effectiveCycle === 'Monthly' ? safeUnits : safeUnits / 2;
    taxRate = 0.06;

    let mEnergy = 0;
    let mFixed = 75;

    if (monthlyUnits <= 100) {
      mEnergy = monthlyUnits * 2.60;
      slabText = `0-100 Units (${effectiveCycle}: ₹2.60/kWh)`;
    } else if (monthlyUnits <= 200) {
      mEnergy = 100 * 2.60 + (monthlyUnits - 100) * 3.60;
      slabText = `101-200 Units (${effectiveCycle}: ₹3.60/kWh)`;
    } else if (monthlyUnits <= 300) {
      mEnergy = 100 * 2.60 + 100 * 3.60 + (monthlyUnits - 200) * 6.90;
      slabText = `201-300 Units (${effectiveCycle}: ₹6.90/kWh)`;
    } else {
      mEnergy = 100 * 2.60 + 100 * 3.60 + 100 * 6.90 + (monthlyUnits - 300) * 9.50;
      slabText = `300+ Units (${effectiveCycle}: ₹9.50/kWh)`;
    }

    if (effectiveCycle === 'Monthly') {
      energyCharge = mEnergy;
      fixedCharge = mFixed;
    } else {
      energyCharge = mEnergy * 2;
      fixedCharge = mFixed * 2;
    }
  } else {
    // Default Tariff
    const mult = effectiveCycle === 'Bi-Monthly' ? 2 : 1;
    fixedCharge = 80 * mult;
    taxRate = 0.05;

    if (safeUnits <= 200 * mult) {
      energyCharge = safeUnits * 4.20;
      slabText = `Standard Tier 1 (${effectiveCycle}: ₹4.20/kWh)`;
    } else if (safeUnits <= 400 * mult) {
      energyCharge = (200 * mult) * 4.20 + (safeUnits - 200 * mult) * 6.50;
      slabText = `Standard Tier 2 (${effectiveCycle}: ₹6.50/kWh)`;
    } else {
      energyCharge = (200 * mult) * 4.20 + (200 * mult) * 6.50 + (safeUnits - 400 * mult) * 8.50;
      slabText = `Standard Tier 3 (${effectiveCycle}: ₹8.50/kWh)`;
    }
  }

  const taxAndDuty = Math.round((energyCharge + fixedCharge) * taxRate * 100) / 100;
  const totalAmount = Math.round((energyCharge + fixedCharge + taxAndDuty) * 100) / 100;

  return {
    amount: totalAmount,
    tariffSlab: slabText,
    breakdown: {
      energyCharge: Math.round(energyCharge * 100) / 100,
      fixedCharges: Math.round(fixedCharge * 100) / 100,
      taxAndDuty,
    },
  };
}

/**
 * Scikit-learn style linear trend + seasonal regression forecast
 */
export function calculateForecast(
  bills: { scanDate: string; units: number; amount: number; billingCycle?: 'Monthly' | 'Bi-Monthly' }[],
  state: string,
  board: string,
  budgetLimit: number,
  userBillingCycle?: 'Monthly' | 'Bi-Monthly'
): PredictionResult {
  const isBiMonthlyState = ['Tamil Nadu', 'Kerala', 'Gujarat', 'Punjab'].some((s) => (state || '').includes(s));
  const effectiveCycle = userBillingCycle || (isBiMonthlyState ? 'Bi-Monthly' : 'Monthly');

  if (!bills || bills.length === 0) {
    const defaultUnits = effectiveCycle === 'Bi-Monthly' ? 350 : 250;
    const computed = calculateTariff(defaultUnits, state, board, effectiveCycle);
    return {
      predictedUnits: defaultUnits,
      predictedAmount: computed.amount,
      trend: 'stable',
      confidencePct: 85,
      budgetExceeded: computed.amount > budgetLimit,
      budgetLimit,
      monthlyHistory: [],
    };
  }

  // Sort bills chronologically ascending
  const sorted = [...bills].sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());

  // Extract history data points
  const monthlyData: MonthlyChartData[] = sorted.slice(-12).map((b) => {
    const d = new Date(b.scanDate);
    const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    return {
      month: monthLabel,
      units: b.units,
      amount: b.amount,
      isForecast: false,
    };
  });

  const n = monthlyData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  monthlyData.forEach((item, index) => {
    const x = index + 1;
    const y = item.units;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  let slope = 0;
  let intercept = sumY / Math.max(1, n);

  if (n > 1) {
    const denominator = n * sumXX - sumX * sumX;
    if (denominator !== 0) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    }
  }

  const nextX = n + 1;
  let rawPredictedUnits = intercept + slope * nextX;

  // Seasonal adjustment for current summer/monsoon months (July/August)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  let seasonalFactor = 1.0;
  if (currentMonth >= 4 && currentMonth <= 7) {
    seasonalFactor = 1.12;
  } else if (currentMonth >= 11 || currentMonth <= 1) {
    seasonalFactor = 0.92;
  }

  const minUnits = effectiveCycle === 'Bi-Monthly' ? 80 : 40;
  const predictedUnits = Math.max(minUnits, Math.round(rawPredictedUnits * seasonalFactor));
  const tariffResult = calculateTariff(predictedUnits, state, board, effectiveCycle);
  const predictedAmount = tariffResult.amount;

  const lastUnits = monthlyData[monthlyData.length - 1]?.units || predictedUnits;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (predictedUnits > lastUnits * 1.05) trend = 'up';
  else if (predictedUnits < lastUnits * 0.95) trend = 'down';

  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + (effectiveCycle === 'Bi-Monthly' ? 2 : 1));
  const forecastLabel = nextMonthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }) + ' (Forecast)';

  const fullHistoryWithForecast: MonthlyChartData[] = [
    ...monthlyData,
    {
      month: forecastLabel,
      units: predictedUnits,
      amount: predictedAmount,
      isForecast: true,
    },
  ];

  return {
    predictedUnits,
    predictedAmount,
    trend,
    confidencePct: Math.min(96, Math.max(75, 70 + n * 2)),
    budgetExceeded: predictedAmount > budgetLimit,
    budgetLimit,
    monthlyHistory: fullHistoryWithForecast,
  };
}
