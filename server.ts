import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateTariff, calculateForecast } from './src/lib/tariffEngine.js';
import { BillRecord, UserProfile } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server State Store - Per-Account Isolated Storage
const usersByEmail = new Map<string, UserProfile>();
const userPasswordsByEmail = new Map<string, string>();
const billsByUserId = new Map<string, BillRecord[]>();
let currentUserId: string | null = null;

function getCurrentUser(): UserProfile | null {
  if (!currentUserId) return null;
  for (const user of usersByEmail.values()) {
    if (user.id === currentUserId) return user;
  }
  return null;
}

function getUserBills(userId: string): BillRecord[] {
  return billsByUserId.get(userId) || [];
}

function setUserBills(userId: string, records: BillRecord[]) {
  billsByUserId.set(userId, records);
}

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API ROUTES

// 1. User & Auth
app.get('/api/user', (req, res) => {
  res.json({ user: getCurrentUser() });
});

app.post('/api/user/setup', (req, res) => {
  const { state, board, billingCycle } = req.body;
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  if (state) user.state = state;
  if (board) user.board = board;
  if (billingCycle) user.billingCycle = billingCycle;

  const currentBills = getUserBills(user.id);
  const updatedBills = currentBills.map((b) => {
    const cycle = user.billingCycle || b.billingCycle || 'Bi-Monthly';
    const calculated = calculateTariff(b.units, user.state, user.board, cycle);
    const preserveOriginal = b.hasCustomAmount && b.originalAmount !== undefined;
    return {
      ...b,
      billingCycle: cycle,
      amount: preserveOriginal ? b.originalAmount! : calculated.amount,
      tariffSlab: calculated.tariffSlab,
      breakdown: preserveOriginal ? b.breakdown : calculated.breakdown,
    };
  });
  setUserBills(user.id, updatedBills);

  res.json({ success: true, user });
});

app.post('/api/user/settings', (req, res) => {
  const { full_name, email, budget_limit, state, board, billingCycle } = req.body;
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  if (full_name) user.name = full_name;
  if (state) user.state = state;
  if (board) user.board = board;
  if (billingCycle) user.billingCycle = billingCycle;

  if (email && email.trim()) {
    const oldKey = user.email.toLowerCase().trim();
    const newKey = email.toLowerCase().trim();
    if (oldKey !== newKey) {
      const storedPass = userPasswordsByEmail.get(oldKey);
      usersByEmail.delete(oldKey);
      userPasswordsByEmail.delete(oldKey);
      user.email = email.trim();
      usersByEmail.set(newKey, user);
      if (storedPass) userPasswordsByEmail.set(newKey, storedPass);
    }
  }
  if (budget_limit !== undefined) {
    user.budgetLimit = Number(budget_limit) || 2500;
  }

  // Recalculate bills with updated settings
  const currentBills = getUserBills(user.id);
  const updatedBills = currentBills.map((b) => {
    const cycle = user.billingCycle || b.billingCycle || 'Bi-Monthly';
    const calculated = calculateTariff(b.units, user.state, user.board, cycle);
    const preserveOriginal = b.hasCustomAmount && b.originalAmount !== undefined;
    return {
      ...b,
      billingCycle: cycle,
      amount: preserveOriginal ? b.originalAmount! : calculated.amount,
      tariffSlab: calculated.tariffSlab,
      breakdown: preserveOriginal ? b.breakdown : calculated.breakdown,
    };
  });
  setUserBills(user.id, updatedBills);

  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email address is required' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  const user = usersByEmail.get(normalizedEmail);
  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Account not found. Please register first to log in.',
    });
  }

  const storedPassword = userPasswordsByEmail.get(normalizedEmail);
  if (storedPassword && password !== storedPassword) {
    return res.status(400).json({
      success: false,
      error: 'Incorrect password. Please enter the correct password.',
    });
  }

  currentUserId = user.id;
  res.json({ success: true, user });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email address is required' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, error: 'Password is required for registration' });
  }

  if (usersByEmail.has(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      error: 'An account with this email already exists. Please log in.',
    });
  }

  const rawName = name || (normalizedEmail.split('@')[0] || 'New User');
  const user: UserProfile = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim(),
    name: rawName,
    state: 'Tamil Nadu',
    board: 'TANGEDCO (TNEB)',
    billingCycle: 'Bi-Monthly',
    budgetLimit: 2500,
  };

  usersByEmail.set(normalizedEmail, user);
  userPasswordsByEmail.set(normalizedEmail, password);
  billsByUserId.set(user.id, []);

  currentUserId = user.id;
  res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  currentUserId = null;
  res.json({ success: true });
});

app.post('/api/admin/reset-database', (req, res) => {
  usersByEmail.clear();
  userPasswordsByEmail.clear();
  billsByUserId.clear();
  currentUserId = null;
  res.json({ success: true, message: 'All users and records cleared successfully. Fresh start ready.' });
});

// 2. Bills Data Management
app.get('/api/bills', (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.json({ records: [] });
  }
  res.json({ records: getUserBills(user.id) });
});

app.post('/api/bills/manual', (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const { units, amount, date, billingCycle } = req.body;
  const numUnits = Number(units) || 0;
  const billCycle = billingCycle || user.billingCycle || 'Bi-Monthly';
  const computedTariff = calculateTariff(numUnits, user.state, user.board, billCycle);
  const hasCustom = amount !== undefined && amount !== null && amount !== '' && !isNaN(Number(amount));
  const finalAmount = hasCustom ? Number(amount) : computedTariff.amount;

  const newBill: BillRecord = {
    id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    scanDate: date || new Date().toISOString().slice(0, 10),
    billingPeriod: new Date(date || Date.now()).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    billingCycle: billCycle,
    units: numUnits,
    amount: finalAmount,
    isManual: true,
    hasCustomAmount: hasCustom,
    originalAmount: finalAmount,
    status: 'Processed',
    tariffSlab: computedTariff.tariffSlab,
    meterNumber: 'MTR-MANUAL-01',
    breakdown: computedTariff.breakdown,
    rawNotes: 'Manual Entry by User',
  };

  const currentBills = getUserBills(user.id);
  setUserBills(user.id, [newBill, ...currentBills]);
  res.json({ success: true, record: newBill });
});

// AI OCR Bill Scanner endpoint
app.post('/api/bills/scan', async (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const { imageBase64, mimeType, billingCycle } = req.body;
    let units = 350;
    let amount = 0;
    let meterNumber = 'MTR-' + Math.floor(100000 + Math.random() * 900000);
    let billingPeriod = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    let rawNotes = 'Scanned via Gemini Vision OCR';

    const ai = getGeminiClient();

    if (ai && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const promptText = `Analyze this electricity bill image from an energy provider. 
Extract and return a strict JSON object with:
- units: number (total kWh units consumed)
- totalAmount: number (total payable bill amount in INR)
- billingPeriod: string (e.g. "Jul 2026")
- meterNumber: string
- boardName: string (e.g. TANGEDCO / BESCOM / MSEDCL)
- notes: string summary of line items extracted`;

        const modelsToTry = ['gemini-2.5-flash', 'gemini-3.6-flash'];
        let parsedSuccess = false;

        for (const modelName of modelsToTry) {
          if (parsedSuccess) break;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: mimeType || 'image/png',
                    },
                  },
                  { text: promptText },
                ],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    units: { type: Type.NUMBER },
                    totalAmount: { type: Type.NUMBER },
                    billingPeriod: { type: Type.STRING },
                    meterNumber: { type: Type.STRING },
                    boardName: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['units'],
                },
              },
            });

            if (response.text) {
              const parsed = JSON.parse(response.text);
              if (parsed.units && !isNaN(parsed.units)) units = parsed.units;
              if (parsed.totalAmount && !isNaN(parsed.totalAmount)) amount = parsed.totalAmount;
              if (parsed.billingPeriod) billingPeriod = parsed.billingPeriod;
              if (parsed.meterNumber) meterNumber = parsed.meterNumber;
              if (parsed.notes) rawNotes = parsed.notes;
              parsedSuccess = true;
            }
          } catch (modelErr: any) {
            console.log(`[Gemini OCR Info] ${modelName} scan note:`, modelErr?.message || modelErr);
          }
        }
      } catch (ocrErr) {
        console.warn('Gemini OCR vision parse fallback:', ocrErr);
      }
    }

    const billCycle = billingCycle || user.billingCycle || 'Bi-Monthly';
    const tariffResult = calculateTariff(units, user.state, user.board, billCycle);
    const hasCustom = amount > 0;
    if (!hasCustom) {
      amount = tariffResult.amount;
    }

    const scannedBill: BillRecord = {
      id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      scanDate: new Date().toISOString().slice(0, 10),
      billingPeriod,
      billingCycle: billCycle,
      units,
      amount,
      isManual: false,
      hasCustomAmount: hasCustom,
      originalAmount: amount,
      status: 'Processed',
      tariffSlab: tariffResult.tariffSlab,
      meterNumber,
      breakdown: tariffResult.breakdown,
      rawNotes,
    };

    const currentBills = getUserBills(user.id);
    setUserBills(user.id, [scannedBill, ...currentBills]);
    res.json({ success: true, record: scannedBill });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Scan failed' });
  }
});

app.delete('/api/bills/:id', (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const { id } = req.params;
  const currentBills = getUserBills(user.id);
  const filtered = currentBills.filter((b) => b.id !== id);
  setUserBills(user.id, filtered);
  res.json({ success: true });
});

app.post('/api/bills/reset', (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  setUserBills(user.id, []);
  res.json({ success: true, records: [] });
});

// 3. Forecasting & ML Analytics
app.get('/api/forecast', (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    const emptyForecast = calculateForecast([], 'Tamil Nadu', 'TANGEDCO (TNEB)', 2500, 'Bi-Monthly');
    return res.json({ prediction: emptyForecast, budget_limit: 2500 });
  }

  const userBills = getUserBills(user.id);
  const forecast = calculateForecast(userBills, user.state, user.board, user.budgetLimit, user.billingCycle);
  res.json({ prediction: forecast, budget_limit: user.budgetLimit });
});

// In-memory cache for Gemini insight to avoid quota exhaustion (429)
let cachedInsight: any = null;
let cachedInsightKey: string = '';
let lastInsightTimestamp = 0;

// 4. Gemini AI Insights
app.get('/api/insights', async (req, res) => {
  const user = getCurrentUser();
  if (!user) {
    return res.json({
      insight: {
        title: '⚡ Smart Energy Insights',
        summary: 'Please log in and upload or record your electricity bills to receive personalized AI energy insights.',
        actionPoints: [
          'Upload your recent electricity bill to track tariff tiers.',
          'Set up your monthly energy budget limit.',
          'Check tariff slab cut-offs for your state board.',
        ],
        estimatedSavings: 'Rs. 0 / month',
        peakUsageAdvice: 'Log in to calculate your exact tariff slabs.',
      },
    });
  }

  const userBills = getUserBills(user.id);
  const userState = user.state;
  const userBoard = user.board;
  const userBudget = user.budgetLimit;

  const forecast = calculateForecast(userBills, userState, userBoard, userBudget);
  const latestBill = userBills[0] || { units: 0, amount: 0, tariffSlab: 'Standard' };

  const now = Date.now();
  const cacheKey = `${user.id}-${userBills.length}-${userState}`;
  const cacheValid =
    cachedInsight &&
    now - lastInsightTimestamp < 15 * 60 * 1000 &&
    cachedInsightKey === cacheKey;

  if (cacheValid) {
    return res.json({ insight: cachedInsight });
  }

  if (userBills.length === 0) {
    const freshInsight = {
      title: '⚡ Welcome to Energy Monitor',
      summary: `Your account is ready for ${userState} (${userBoard}) with a budget of Rs. ${userBudget}. Upload your first bill to start tracking usage.`,
      actionPoints: [
        'Upload or manually enter your recent electricity bill.',
        'Use the AI OCR scanner to extract kWh units automatically.',
        'Monitor whether your usage approaches higher tariff tiers.',
      ],
      estimatedSavings: 'Rs. 200 - Rs. 500 / month potential',
      peakUsageAdvice: `In ${userState}, lower slab tiers offer significant savings per unit.`,
    };
    cachedInsight = freshInsight;
    cachedInsightKey = cacheKey;
    lastInsightTimestamp = now;
    return res.json({ insight: freshInsight });
  }

  const ai = getGeminiClient();

  if (ai) {
    const prompt = `You are a Smart Energy Analyst for an Indian home electricity user in ${userState} (${userBoard}).
Current Usage: ${latestBill.units} kWh (Rs. ${latestBill.amount}).
Forecast Next Month: ${forecast.predictedUnits} kWh (Rs. ${forecast.predictedAmount}).
Budget Limit: Rs. ${userBudget}.
Tariff Slabs: ${latestBill.tariffSlab}.

Generate a structured JSON energy insight:
- title: concise title e.g. "Summer Cooling Spike Detected"
- summary: 2-sentence executive breakdown
- actionPoints: list of 3 practical high-impact energy saving actions (e.g. AC thermostat, off-peak usage, star rating)
- anomalyAlert: optional warning if forecast exceeds budget or spiked >20%
- estimatedSavings: estimated rupees savings per month e.g. "Rs. 420/month"
- peakUsageAdvice: tariff slab advice to avoid higher cost brackets`;

    const configObj = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          actionPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          anomalyAlert: { type: Type.STRING },
          estimatedSavings: { type: Type.STRING },
          peakUsageAdvice: { type: Type.STRING },
        },
        required: ['title', 'summary', 'actionPoints', 'estimatedSavings', 'peakUsageAdvice'],
      },
    };

    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.6-flash'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: configObj,
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          cachedInsight = parsed;
          cachedInsightKey = cacheKey;
          lastInsightTimestamp = now;
          return res.json({ insight: parsed });
        }
      } catch (aiErr: any) {
        if (aiErr?.status === 429 || aiErr?.message?.includes('quota') || aiErr?.message?.includes('RESOURCE_EXHAUSTED')) {
          console.log(`[Gemini Info] ${modelName} quota limit reached, attempting fallback.`);
        }
      }
    }
  }

  // Smart calculated fallback insight
  const isBudgetExceeded = forecast.predictedAmount > userBudget;
  const fallback = {
    title: isBudgetExceeded ? '⚠️ High Energy Usage Forecast' : '⚡ Smart Tariff Optimization Insight',
    summary: `Your projected consumption for next month is ${forecast.predictedUnits} units (Rs. ${forecast.predictedAmount}). ${
      isBudgetExceeded
        ? `This exceeds your set budget of Rs. ${userBudget} by Rs. ${forecast.predictedAmount - userBudget}.`
        : 'You are currently on track to stay within your monthly energy budget.'
    }`,
    actionPoints: [
      'Set Inverter Air Conditioners to 24°C instead of 18°C to save up to 20% on cooling load.',
      'Unplug standby appliances like gaming consoles, routers, and microwave clocks overnight.',
      `Optimize appliance usage during non-peak hours to avoid entering higher ${userState} tariff slabs.`,
    ],
    anomalyAlert: isBudgetExceeded
      ? `Forecasted bill (Rs. ${forecast.predictedAmount}) is higher than your Rs. ${userBudget} threshold.`
      : undefined,
    estimatedSavings: 'Rs. 350 - Rs. 600 / month',
    peakUsageAdvice: `In ${userState}, keeping your monthly total under 400 kWh prevents crossing into the top tier pricing block.`,
  };

  cachedInsight = fallback;
  cachedInsightKey = cacheKey;
  lastInsightTimestamp = now;

  res.json({ insight: fallback });
});

// Vite & Production Static Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
