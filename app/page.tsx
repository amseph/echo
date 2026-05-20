'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Tesseract from 'tesseract.js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
const getAllowanceCycle = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];

  // Calculate the week number of the month
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDayOfMonth.getDay();
  const adjustedDate = date.getDate() + dayOfWeek - 1;
  const weekNum = Math.ceil(adjustedDate / 7);

  return `Week ${weekNum} - ${month}`;
};

const ECHO_FAQS = [
  { question: "What is the \"Predicted Broke Date\" or \"Runway\"?", answer: "It calculates exactly how many days your remaining allowance will last based on your real spending velocity over the past 7 days. If you haven't spent anything, it defaults to an \"Infinite Runway.\"" },
  { question: "What does \"Pure Hermit Mode\" mean?", answer: "This is a special status triggered automatically when you haven't logged a single expense for the current cycle. It means your budget is 100% intact!" },
  { question: "Why did the Receipt Scanner get the wrong amount?", answer: "Dot-matrix or blurry receipts can sometimes cause the AI text reader to misalign lines. If it misreads a digit, don't worry—the scanner only pre-fills the box. You can manually tap the input field to correct the amount before hitting record." },
  { question: "Can I delete an incorrect transaction?", answer: "Yes. If you make a typo or accidentally record a scan, scroll down to your Transaction History, find the item, and tap the trash icon to wipe it from your ledger instantly." },
  { question: "How do I change my tracking period?", answer: "In the Settings tab, look for the Allowance Cycle dropdown. You can switch between a Weekly or Monthly cadence to match how you actually receive your money." },
  { question: "How do I start a completely fresh cycle?", answer: "If you want to clear your testing data or start over, go to Settings and use the Reset Ledger Data button. This permanently wipes your history so you can begin fresh." }
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [initialAllowance, setInitialAllowance] = useState('');
  const [initialCategory, setInitialCategory] = useState('Parents / Family');
  const [cycleType, setCycleType] = useState('monthly');
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'settings'>('home');
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: 'home' | 'analytics' | 'settings') => {
    const tabs = ['home', 'analytics', 'settings'];
    const newIdx = tabs.indexOf(newTab);
    const oldIdx = tabs.indexOf(activeTab);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  const [isMounted, setIsMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };
  const [message, setMessage] = useState({ type: '', text: '' });
  const [customCategory, setCustomCategory] = useState('');
  const [cyclePreference, setCyclePreference] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('echo_cycle') || 'Monthly' : 'Monthly');
  const [toneMode, setToneMode] = useState<'Coach' | 'Roast'>(() => typeof window !== 'undefined' ? (localStorage.getItem('echo_tone') as 'Coach' | 'Roast') || 'Roast' : 'Roast');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => typeof window !== 'undefined' ? (localStorage.getItem('echo_theme') as 'light' | 'dark') || 'light' : 'light');
  const [userEmail, setUserEmail] = useState('');

  const handleToneChange = (value: string) => {
    setToneMode(value as 'Coach' | 'Roast');
    localStorage.setItem('echo_tone', value);
  };

  const handleThemeChange = (val: 'light' | 'dark') => { setTheme(val); localStorage.setItem('echo_theme', val); };

  const getVibeStrings = (burnPct: number) => {
    if (toneMode === 'Coach') {
      if (burnPct === 0) return { title: 'Perfectly Pristine ', desc: "You haven't spent anything yet. Keep up this great start!" };
      if (burnPct < 25) return { title: 'Excellent Pacing ', desc: 'You are managing your funds incredibly well. Keep it up!' };
      if (burnPct < 60) return { title: 'Steady & Balanced ', desc: 'You are right on track. Sustainable spending is key.' };
      if (burnPct < 85) return { title: 'Caution Advised ', desc: 'You are spending a bit fast. Time to review your budget.' };
      return { title: 'Action Required ', desc: 'Your budget is running low. Please limit non-essential expenses.' };
    } else {
      if (burnPct === 0) return { title: 'Pure Hermit Mode ', desc: 'No expenses logged yet. Are you even alive?' };
      if (burnPct < 25) return { title: 'Kuripot Master ', desc: 'Solid discipline. Your wallet is safe from impulse checkouts.' };
      if (burnPct < 60) return { title: 'Balanced Lifestyle ', desc: 'Surviving beautifully. Clean balance between wants and needs.' };
      if (burnPct < 85) return { title: 'Petsa de Peligro ', desc: 'The velocity of your spending is getting sketchy. Slow down!' };
      return { title: 'Walang-Wala Mode ', desc: 'Budget critical. Instant noodles era has officially arrived.' };
    }
  };

  const getBrokeDateText = (daysRemaining: number | null, netBal: number) => {
    if (netBal <= 0) return toneMode === 'Coach' ? 'Budget Exhausted ' : 'You are already broke ';
    if (daysRemaining === null) return 'Infinite Runway ';
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysRemaining);
    if (daysRemaining === 0) return toneMode === 'Coach' ? 'Depletes Today ' : 'Today (Check your pockets!) ';
    if (daysRemaining === 1) return 'Tomorrow ';
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };
  const [scanning, setScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Filter out lines containing cash, change, tendered, received, or payment
      const ignoreRegex = /\b(CASH|CHANGE|TENDERED|RECEIVED|PAYMENT)\b/i;
      const cleanLines = lines.filter(line => !ignoreRegex.test(line));
      const cleanText = cleanLines.join('\n');

      // Extract the highest remaining numeric value from the clean text
      let totalAmount: number | null = null;
      const allAmounts = cleanText.match(/[\d,]+\.\d{2}/g);
      if (allAmounts && allAmounts.length > 0) {
        const parsed = allAmounts.map(a => parseFloat(a.replace(/,/g, '')));
        totalAmount = Math.max(...parsed);
      }

      if (totalAmount !== null && totalAmount > 0) {
        setFormData(prev => ({ ...prev, amount: totalAmount!.toFixed(2) }));
        setMessage({ type: 'success', text: `Receipt scanned: ₱${totalAmount.toFixed(2)} detected.` });
      } else {
        showToast('Could not read receipt clearly. Please upload a clearer image.', 'error');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setMessage({ type: 'error', text: 'Receipt scan failed. Please try again.' });
    } finally {
      setScanning(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear state and force redirect back to login
      router.push('/login');
      router.refresh();
    } catch (error: any) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    setConfirmDeleteId(id);
  };

  const executeDeleteTransaction = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Transaction deleted successfully.', 'success');
    } catch (error: any) {
      showToast('Error deleting transaction: ' + error.message, 'error');
    }
  };

  const handleResetLedger = async () => {
    if (!window.confirm('Are you sure you want to completely wipe your ledger? This cannot be undone.')) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('transactions').delete().eq('user_id', user.id);
      if (!error) {
        setTransactions([]);
        handleTabChange('home');
      } else {
        showToast('Error resetting data: ' + error.message, 'error');
      }
    }
    setLoading(false);
  };

  const handleCycleChange = (value: string) => {
    setCyclePreference(value);
    localStorage.setItem('echo_cycle', value);
  };

  const handleInitializeCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialAllowance || parseFloat(initialAllowance) <= 0) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            transaction_type: 'allowance',
            amount: parseFloat(initialAllowance),
            expense_category: initialCategory,
            transaction_date: todayDate,
            allowance_cycle: getAllowanceCycle(todayDate),
          }
        ]);

      if (!error) {
        setInitialAllowance('');
        setInitialCategory('Parents / Family');
        localStorage.setItem('echo_allowance_cycle', cycleType);
        await fetchTransactions();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const initialDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    transaction_date: initialDate,
    transaction_type: 'expense',
    amount: '',
    expense_category: 'Food',
    allowance_cycle: getAllowanceCycle(initialDate), // Auto-calculate on load
  });

  const fetchTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);

    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Direct unauthorized visitors out to the login page immediately
        router.push('/login');
      } else {
        setUserEmail(session.user.email ?? '');
        // Load current user's isolated transaction data from Supabase rows
        fetchTransactions();
      }
    };

    checkUserSession();
  }, []);

  // --- DATA PROCESSING FOR ANALYTICS ---
  const currentMonthTransactions = transactions.filter((t) =>
    t.transaction_date.startsWith(new Date().toISOString().slice(0, 7))
  );

  const totalAllowance = currentMonthTransactions
    .filter((t) => t.transaction_type === 'allowance')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalShortages = currentMonthTransactions
    .filter((t) => t.transaction_type === 'shortage_request')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDebt = transactions
    .filter((t) => t.transaction_type === 'debt')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalAllowance + totalShortages + totalDebt - totalExpenses;

  // Automatically switch categories based on Type to ensure clean data entries
  const handleTypeChange = (type: string) => {
    let defaultCategory = 'Food';
    if (type === 'allowance') defaultCategory = 'Regular Weekly Allowance';
    if (type === 'shortage_request') defaultCategory = 'Emergency / Shortage';
    if (type === 'debt') defaultCategory = '';

    setFormData({
      ...formData,
      transaction_type: type,
      expense_category: defaultCategory,
    });
    setCustomCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.transaction_type === 'expense' && parseFloat(formData.amount) > netBalance) {
      setMessage({ type: 'error', text: 'Kulang ang iyong pondo! I-log muna ang inutang (Debt) o hininging pondo bago gastusin.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const categoryToSend = formData.expense_category === 'Other' ? customCategory : formData.expense_category;
      const transactionType = formData.expense_category === 'debt_payment' ? 'debt_payment' : formData.transaction_type;
      const amount = formData.amount;

      if (transactionType === 'debt_payment') {
        if (parseFloat(amount) > totalDebt) {
          showToast(`Validation Error: You cannot pay back more than your current total debt of ₱${totalDebt.toFixed(2)}.`, 'error');
          setLoading(false);
          return; // Kill execution early
        }

        if (parseFloat(amount) > netBalance) {
          showToast(`Validation Error: Insufficient funds. Your current net balance is ₱${netBalance.toFixed(2)}, you cannot afford this payment.`, 'error');
          setLoading(false);
          return; // Kill execution early
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user?.id,
          transaction_date: formData.transaction_date,
          transaction_type: transactionType,
          amount: Number(amount),
          expense_category: categoryToSend,
          allowance_cycle: formData.allowance_cycle,
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Transaction recorded!' });

      // Reset amount and customCategory but preserve type, category, and cycle for rapid entry
      setFormData(prev => ({ ...prev, amount: '' }));
      setCustomCategory('');
      fetchTransactions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = transactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.expense_category] = (acc[t.expense_category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const chartData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB'];

  // --- RUNWAY CALCULATION ---
  // 1. Get transactions from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentExpenses = transactions.filter((t) => {
    return t.transaction_type === 'expense' && new Date(t.transaction_date) >= sevenDaysAgo;
  });

  // 2. Calculate average daily spend
  const totalRecentSpent = recentExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const dailyAverageSpend = totalRecentSpent / 7;

  // 3. Calculate remaining days of runway
  const daysRemaining = dailyAverageSpend > 0 ? Math.floor(netBalance / dailyAverageSpend) : null;

  // --- VIBE CHECK (component-level for notifications) ---
  const burnPct = totalAllowance > 0 ? Math.min(Math.round((totalExpenses / totalAllowance) * 100), 100) : 0;
  const { title: vibeNotifTitle, desc: vibeNotifDesc } = getVibeStrings(burnPct);

  // --- BROWSER NOTIFICATION ---
  useEffect(() => {
    if (loading || transactions.length === 0) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const fireNotification = () => {
      if (Notification.permission === 'granted') {
        new Notification(`ECHO Vibe Check: ${vibeNotifTitle}`, {
          body: vibeNotifDesc,
          icon: '/favicon.ico',
          tag: 'echo-vibe-check',
        });
      }
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') fireNotification();
      });
    } else {
      fireNotification();
    }
  }, [loading, transactions.length, vibeNotifTitle, vibeNotifDesc]);

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-neutral-900 px-4 py-8 font-sans antialiased text-[#1d1d1f] dark:text-neutral-100 ${theme === 'dark' ? 'dark' : ''}`}>
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed top-6 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md border mx-auto max-w-sm ${
              toastMessage.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-700' : 'bg-[#1d1d1f]/90 border-[#3d3d42] text-white'
            }`}
          >
            <div className="flex-1">
              <span className="text-sm font-semibold tracking-tight">{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="opacity-60 hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
        
        {confirmDeleteId !== null && (
          <motion.div
            key="confirm-delete"
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-6 left-4 right-4 z-[60] flex flex-col gap-3 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl border border-red-200 bg-white/95 mx-auto max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-[#1d1d1f]">Delete Transaction?</h3>
                <p className="text-xs text-[#86868b] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 text-sm font-semibold text-[#1d1d1f] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteTransaction}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20 active:scale-95"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case 1: Database is still pulling rows */}
      {loading ? (
        <div className="mx-auto max-w-5xl space-y-6 animate-pulse mt-2 dark:opacity-50">
          {/* Header Placeholder */}
          <div className="flex items-start justify-between border-b border-[#e8e8ed] pb-6 mb-8">
            <div className="space-y-2">
              <div className="h-9 w-24 bg-[#e8e8ed] rounded-xl" />
              <div className="h-4 w-48 bg-[#e8e8ed] rounded-lg" />
            </div>
            <div className="h-8 w-24 bg-[#e8e8ed] rounded-xl" />
          </div>

          {/* Metric Cards Placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full max-w-4xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 h-[90px] p-5 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm flex flex-col justify-between">
                <div className="h-3 w-16 bg-[#f5f5f7] rounded-md" />
                <div className="h-5 w-24 bg-[#f5f5f7] rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (

        /* Case 2: User is logged in but has a clean slate (Onboarding View) */
        <div className="flex min-h-[70vh] items-center justify-center animate-fadeIn">
          <div className="w-full max-w-[440px] rounded-3xl border border-[#e8e8ed] dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Welcome to ECHO</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#86868b]">
              Let’s initialize your tracking cycle. Enter your current starting allowance or pocket money to unlock your dashboard.
            </p>

            <form onSubmit={handleInitializeCycle} className="mt-6 space-y-4">
              <div className="text-left">
                <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">Budget Cycle</label>
                <select
                  value={cycleType}
                  onChange={(e) => setCycleType(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm bg-white outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                >
                  <option value="weekly">Weekly (Resets Mondays)</option>
                  <option value="semi-monthly">Semi-Monthly (1st &amp; 15th)</option>
                  <option value="monthly">Monthly (Calendar Month)</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">Starting Amount (₱)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={initialAllowance}
                  onChange={(e) => setInitialAllowance(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm placeholder-[#86868b] outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">Category</label>
                <select
                  value={initialCategory}
                  onChange={(e) => setInitialCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm bg-white outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                >
                  <option value="Regular Weekly Allowance">Regular Weekly Allowance</option>
                  <option value="Parents / Family">Parents / Family</option>
                  <option value="Scholarship / Stipend">Scholarship / Stipend</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#0071e3] py-3 text-sm font-medium text-white transition-all hover:bg-[#0077ed]"
              >
                Activate Dashboard
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Case 3: Redesigned dashboard */
        <>
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === 'home' && (() => {
              const homeBurnPct = totalAllowance > 0 ? Math.min(Math.round((totalExpenses / totalAllowance) * 100), 100) : 0;
              const homeDaysAgo = new Date(); homeDaysAgo.setDate(homeDaysAgo.getDate() - 7);
              const homeRecent = transactions.filter(t => t.transaction_type === 'expense' && new Date(t.transaction_date) >= homeDaysAgo);
              const homeAvgSpend = homeRecent.reduce((s, t) => s + Number(t.amount), 0) / 7;
              const homeDaysRemaining = homeAvgSpend > 0 ? Math.floor(netBalance / homeAvgSpend) : null;
              const homeBrokeText = getBrokeDateText(homeDaysRemaining, netBalance);
              const { title: homeVibeTitle, desc: homeVibeDesc } = getVibeStrings(homeBurnPct);
              const isCritical = netBalance <= 0 || homeBrokeText.includes('Today') || homeBrokeText.includes('Tomorrow');

              const listContainer: Variants = {
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
              };
              const listItem: Variants = {
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
              };

              const tabVariants: Variants = {
                initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 20 : -20 }),
                animate: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
              };

              return (
                <motion.div key="home" custom={direction} variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }} className="mx-auto max-w-5xl space-y-5 pb-24">
                  {/* HEADER */}
                  <div 
                    className="bg-[#1d2d2a] dark:bg-neutral-800 rounded-3xl px-6 py-5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b7e887]/70 mb-0.5">ECHO Dashboard</p>
                      <h1 className="text-2xl font-bold text-white tracking-tight">Hello, {userEmail ? userEmail.split('@')[0] : 'User'} </h1>
                      <p className="text-xs text-[#b7e887]/60 mt-0.5">Expense &amp; Cashflow Habit Observer</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTabChange('settings')}
                        className="hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                      <button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* METRIC CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Allowance</p>
                      <p className="text-xl font-bold text-[#1d2d2a] mt-1">₱{totalAllowance.toFixed(2)}</p>
                      <p className="text-[10px] text-green-500 mt-1 font-medium">● Inflow this cycle</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expenses</p>
                      <p className="text-xl font-bold text-[#1d1d1f] mt-1">₱{totalExpenses.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{homeBurnPct}% of budget</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${totalDebt > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Debt</p>
                      <p className="text-xl font-bold text-amber-700 mt-1">₱{totalDebt.toFixed(2)}</p>
                      <p className="text-[10px] text-amber-500 mt-1 font-medium">{totalDebt > 0 ? '⚠ Outstanding' : '● Clear'}</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${netBalance <= 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Balance</p>
                      <p className={`text-xl font-bold mt-1 ${netBalance <= 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>₱{netBalance.toFixed(2)}</p>
                      <p className={`text-[10px] mt-1 font-medium ${netBalance <= 0 ? 'text-red-400' : 'text-blue-400'}`}>{netBalance <= 0 ? '● Deficit' : '● Available'}</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${daysRemaining !== null && daysRemaining <= 3 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Runway</p>
                      <p className={`text-xl font-bold mt-1 ${daysRemaining === null || netBalance <= 0 ? 'text-gray-300' : daysRemaining <= 3 ? 'text-red-500' : 'text-[#1d1d1f]'}`}>
                        {daysRemaining === null || netBalance <= 0 ? '—' : `${daysRemaining}d`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">₱{dailyAverageSpend.toFixed(0)}/day avg</p>
                    </motion.div>
                  </div>

                  {/* PREDICTIVE INSIGHT STRIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`rounded-2xl border p-4 ${isCritical ? 'bg-red-50 border-red-200' : 'bg-[#1d2d2a]/5 border-[#1d2d2a]/10'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-1">Predicted Broke Date</p>
                      <p className={`text-2xl font-bold tracking-tight ${isCritical ? 'text-red-500' : 'text-[#1d1d1f]'}`}>{homeBrokeText}</p>
                      <p className="text-[10px] text-[#86868b] mt-1">Based on 7-day spending velocity</p>
                    </div>
                    <div className={`rounded-2xl border p-4 ${homeBurnPct >= 85 ? 'bg-red-50 border-red-300' : homeBurnPct >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-[#f5f5f7] border-[#e8e8ed]'}`}>
                      <p className="text-base font-bold text-[#1d1d1f] mb-0.5">{homeVibeTitle}</p>
                      <p className="text-xs text-[#424245] leading-relaxed">{homeVibeDesc}</p>
                      {totalDebt > 0 && <p className="text-[11px] font-medium text-amber-600 mt-2 pt-2 border-t border-amber-200">⚠️ Utang Alert: You owe ₱{totalDebt.toFixed(2)}. Clear this soon!</p>}
                    </div>
                  </div>

                  {/* MAIN CONTENT GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* LEFT: FORM + CHART */}
                    <div className="lg:col-span-7 space-y-5">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-[#1d1d1f] tracking-tight">Log Transaction</h2>
                          <span className="text-[10px] text-[#86868b] bg-[#f5f5f7] rounded-lg px-2 py-1 font-medium">{formData.allowance_cycle}</span>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                          <input type="date" required
                            className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
                            value={formData.transaction_date}
                            onChange={(e) => { const d = e.target.value; setFormData({ ...formData, transaction_date: d, allowance_cycle: getAllowanceCycle(d) }); }} />
                          <div className="grid grid-cols-2 gap-3">
                            <select className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm bg-white text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
                              value={formData.transaction_type} onChange={(e) => handleTypeChange(e.target.value)}>
                              <option value="expense">Expense</option>
                              <option value="allowance">Allowance</option>
                              <option value="shortage_request">Shortage</option>
                              <option value="debt">Debt</option>
                            </select>
                            <div className="relative flex items-center">
                              <input type="number" step="0.01" required placeholder="₱ 0.00"
                                className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all pr-10"
                                value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                              <button
                                type="button"
                                disabled={scanning}
                                onClick={() => receiptInputRef.current?.click()}
                                className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d2d2a] dark:bg-neutral-600 text-white hover:opacity-90 active:scale-90 transition-all disabled:opacity-40 shadow-sm"
                                title="Scan receipt"
                              >
                                {scanning ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                  </svg>
                                )}
                              </button>
                              <input
                                ref={receiptInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleReceiptScan}
                              />
                            </div>
                          </div>
                          {formData.transaction_type === 'debt' ? (
                            <input type="text" required placeholder="Lender (e.g. Juan, Aling Nena)"
                              className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
                              value={formData.expense_category} onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })} />
                          ) : (
                            <select className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm bg-white text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
                              value={formData.expense_category} onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}>
                              {formData.transaction_type === 'allowance' ? (<>
                                <option value="Regular Weekly Allowance">Regular Weekly Allowance</option>
                                <option value="Parents / Family">Parents / Family</option>
                                <option value="Scholarship / Stipend">Scholarship / Stipend</option>
                                <option value="Other Income">Other Income</option>
                                <option value="debt_payment">Pay Back Debt (Bayad Utang)</option>
                              </>) : formData.transaction_type === 'shortage_request' ? (<>
                                <option value="Emergency / Shortage">Emergency / Shortage</option>
                                <option value="Food Shortage">Food Shortage</option>
                                <option value="Transport Shortage">Transport Shortage</option>
                              </>) : (<>
                                <option value="Food">Food</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Education / Supplies">Education / Supplies</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Utilities / Bills">Utilities / Bills</option>
                                <option value="Other">Other</option>
                              </>)}
                            </select>
                          )}
                          {formData.expense_category === 'Other' && (
                            <input type="text" required placeholder="Specify category" maxLength={25}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] text-sm text-[#1d1d1f] outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
                              value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
                          )}
                          <button type="submit" disabled={loading}
                            className="w-full bg-[#1d2d2a] dark:bg-neutral-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#253d38] dark:hover:bg-neutral-600 active:scale-[0.98] transition-all disabled:opacity-50">
                            {loading ? 'Saving...' : 'Record Transaction'}
                          </button>
                        </form>
                        {message.text && (
                          <div className={`mt-3 p-3 rounded-xl text-xs text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                          </div>
                        )}
                      </motion.div>
                      {/* CHART */}
                      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-[#1d1d1f] tracking-tight mb-3">Expense Distribution</h2>
                        {isMounted && chartData.length > 0 ? (
                          <div className="flex items-center gap-4">
                            <div className="h-40 w-40 flex-shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
                                    {chartData.map((_, index) => <Cell key={index} fill={['#1d2d2a', '#2d4a3e', '#b7e887', '#86c46a', '#5a8f4a'][index % 5]} />)}
                                  </Pie>
                                  <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-1.5 min-w-0">
                              {chartData.map((entry, i) => (
                                <div key={entry.name} className="flex items-center justify-between text-xs gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#1d2d2a', '#2d4a3e', '#b7e887', '#86c46a', '#5a8f4a'][i % 5] }} />
                                    <span className="text-[#424245] truncate">{entry.name}</span>
                                  </div>
                                  <span className="font-bold text-[#1d1d1f] flex-shrink-0">₱{entry.value.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-10">Log expenses to generate distribution.</p>
                        )}
                      </div>
                    </div>
                    {/* RIGHT: LEDGER */}
                    <div className="lg:col-span-5 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5 max-h-[640px] overflow-y-auto">
                      <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-3 sticky top-0 bg-white dark:bg-neutral-800 pb-2 border-b border-gray-100 dark:border-neutral-700">Transaction History</h2>
                      {transactions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-10">No transactions yet.</p>
                      ) : (
                        <motion.div className="space-y-1" variants={listContainer} initial="hidden" animate="visible">
                          <AnimatePresence>
                            {transactions.map((tx) => {
                              const isInflow = tx.transaction_type === 'allowance' || tx.transaction_type === 'shortage_request' || tx.transaction_type === 'debt';
                              const isDebtPay = tx.transaction_type === 'debt_payment';
                              return (
                                <motion.div key={tx.id} variants={listItem} exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 group">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-[#1d1d1f] truncate">{isDebtPay ? 'Paid Back Loan (Soli)' : tx.expense_category}</p>
                                    <p className="text-[10px] text-[#86868b]">{tx.transaction_date} · {tx.allowance_cycle}</p>
                                  </div>
                                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                                    <div className="text-right">
                                      <p className={`font-bold text-sm ${isInflow ? 'text-green-600' : 'text-[#1d1d1f]'}`}>
                                        {isDebtPay ? `−₱${parseFloat(tx.amount).toFixed(2)}` : `${isInflow ? '+' : '−'}₱${parseFloat(tx.amount).toFixed(2)}`}
                                      </p>
                                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#86868b]">{isDebtPay ? 'Settlement' : tx.transaction_type.replace('_', ' ')}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteTransaction(tx.id)}
                                      className="p-1.5 text-[#d2d2d7] hover:text-red-500 hover:bg-red-50 active:scale-95 rounded-lg transition-all"
                                      title="Delete transaction"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}


            {activeTab === 'analytics' && (() => {
              const burnPercentage = totalAllowance > 0 ? Math.min(Math.round((totalExpenses / totalAllowance) * 100), 100) : 0;
              const topCategory = chartData.length > 0 ? chartData.reduce((a, b) => a.value > b.value ? a : b) : null;
              const totalInflows = totalAllowance + totalShortages + totalDebt;
              const totalOutflows = totalExpenses;
              const chartTotal = chartData.reduce((sum, c) => sum + c.value, 0);

              // 1. Calculate Broke Prediction Date
              const sevenDaysAgoCalc = new Date();
              sevenDaysAgoCalc.setDate(sevenDaysAgoCalc.getDate() - 7);
              const recentExpensesCalc = transactions.filter(t => t.transaction_type === 'expense' && new Date(t.transaction_date) >= sevenDaysAgoCalc);
              const totalRecentSpentCalc = recentExpensesCalc.reduce((sum, t) => sum + Number(t.amount), 0);
              const dailyAverageSpendCalc = totalRecentSpentCalc / 7;
              const daysRemaining = dailyAverageSpendCalc > 0 ? Math.floor(netBalance / dailyAverageSpendCalc) : null;
              const brokeDateText = getBrokeDateText(daysRemaining, netBalance);

              // 2. Dynamic Financial Vibe Check Badge
              const { title: vibeTitle, desc: vibeDesc } = getVibeStrings(burnPercentage);

              const tabVariants: Variants = {
                initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 20 : -20 }),
                animate: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
              };

              return (
                <motion.div key="analytics" custom={direction} variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }}>
                  <div className="max-w-md mx-auto space-y-6 pt-4 pb-24">

                    {/* Header */}
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Financial Analytics</h2>

                    {/* Burn Rate Card */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#1d1d1f]">Budget Utilization</p>
                        <p className={`text-sm font-bold ${burnPercentage >= 70 ? 'text-red-500' : 'text-[#1d1d1f]'}`}>
                          {burnPercentage}%
                        </p>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#f5f5f7] overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${burnPercentage >= 90 ? 'bg-red-500' : burnPercentage >= 70 ? 'bg-amber-500' : 'bg-[#1d1d1f]'
                            }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${burnPercentage}%` }}
                          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        />
                      </div>
                      <p className="text-xs text-[#86868b]">
                        {burnPercentage}% of your ₱{totalAllowance.toFixed(2)} allowance has been spent this cycle.
                      </p>
                    </div>

                    {/* Spending Distribution Card */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-4">
                      <p className="text-sm font-medium text-[#1d1d1f]">Spending Distribution</p>
                      {chartData.length > 0 ? (
                        <>
                          <div className="flex justify-center">
                            <ResponsiveContainer width={180} height={180}>
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            {chartData.map((entry, index) => (
                              <div key={entry.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span className="text-[#1d1d1f] font-medium truncate max-w-[140px]">{entry.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[#86868b]">{chartTotal > 0 ? Math.round((entry.value / chartTotal) * 100) : 0}%</span>
                                  <span className="text-[#1d1d1f] font-semibold">₱{entry.value.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[#86868b] text-center py-8">Log expenses to generate category metrics.</p>
                      )}
                    </div>

                    {/* Top Category Insight */}
                    {topCategory && (
                      <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm px-5 py-4">
                        <p className="text-xs font-medium text-amber-800">
                          ⚠️ <span className="font-semibold">{topCategory.name}</span> is your highest expense this cycle at <span className="font-bold">₱{topCategory.value.toFixed(2)}</span>
                        </p>
                      </div>
                    )}

                    {/* Net Flow Card */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-4">
                      <p className="text-sm font-medium text-[#1d1d1f]">Cash Flow Summary</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Total Inflows</p>
                          <p className="text-lg font-bold text-green-600 mt-1">₱{totalInflows.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Total Outflows</p>
                          <p className="text-lg font-bold text-red-500 mt-1">₱{totalOutflows.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f7]">
                        <p className="text-xs text-[#86868b]">Net Balance</p>
                        <p className={`text-sm font-bold ${netBalance >= 0 ? 'text-[#1d1d1f] dark:text-white' : 'text-red-500'}`}>
                          {netBalance >= 0 ? '+' : ''}₱{netBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Broke Clock Card */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#86868b] mb-1">Predicted Broke Date</p>
                      <p className={`text-2xl font-bold tracking-tight ${netBalance < totalAllowance * 0.05 || (brokeDateText.includes('Today') || brokeDateText.includes('Tomorrow')) ? 'text-red-500' : 'text-[#1d1d1f]'}`}>{brokeDateText}</p>
                      <p className="text-xs text-[#86868b] mt-1">Based on your spending speed over the past 7 days.</p>
                    </div>

                    {/* Vibe Check Roast Card */}
                    <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-[#e8e8ed]">
                      <p className="text-base font-semibold text-[#1d1d1f] mb-1">{vibeTitle}</p>
                      <p className="text-sm text-[#424245] leading-relaxed">{vibeDesc}</p>
                      {totalDebt > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#e8e8ed]/60 text-xs font-medium text-amber-600">
                          ⚠️ Utang Alert: You owe someone ₱{totalDebt.toFixed(2)}. Reminder: clear this or your karma points will suffer.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {activeTab === 'settings' && (() => {
              const tabVariants: Variants = {
                initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 20 : -20 }),
                animate: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
              };

              return (
                <motion.div key="settings" custom={direction} variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }} className="max-w-md mx-auto space-y-6 pt-4 pb-24">

                  {/* Title Block */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-[#1d1d1f]">Settings</h2>
                    <button
                      onClick={() => handleTabChange('home')}
                      className="text-xs font-medium text-[#0071e3] hover:underline"
                    >
                      Done
                    </button>
                  </div>

                  {/* Preference Card */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-[#1d1d1f]">Allowance Cycle</p>
                        <p className="text-xs text-[#86868b] mt-0.5">Controls how your metrics reset</p>
                      </div>
                      <select
                        value={cyclePreference}
                        onChange={(e) => handleCycleChange(e.target.value)}
                        className="rounded-lg border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Semi-Monthly">Semi-Monthly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-[#1d1d1f]">Personality Tone</p>
                        <p className="text-xs text-[#86868b] mt-0.5">Coach (Encouraging) vs Roast (Insulting)</p>
                      </div>
                      <div className="flex bg-[#f5f5f7] p-1 rounded-lg border border-[#d2d2d7]">
                        <button
                          onClick={() => handleToneChange('Coach')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${toneMode === 'Coach' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                        >
                          Coach
                        </button>
                        <button
                          onClick={() => handleToneChange('Roast')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${toneMode === 'Roast' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                        >
                          Roast
                        </button>
                      </div>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">Appearance</p>
                        <p className="text-xs text-[#86868b] mt-0.5">Switch between light and dark mode</p>
                      </div>
                      <div className="flex bg-[#f5f5f7] dark:bg-neutral-700 p-1 rounded-lg border border-[#d2d2d7] dark:border-neutral-600">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                        >
                          ☀️ Light
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-neutral-800 shadow-sm text-white' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                        >
                          🌙 Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Card */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-[#86868b]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1d1d1f]">Account</p>
                        <p className="text-xs text-[#86868b] truncate">{userEmail || '—'}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Reset Ledger Data</p>
                          <p className="text-xs text-[#86868b] mt-0.5">Wipe all transaction history to start a fresh cycle.</p>
                        </div>
                        <button
                          onClick={handleResetLedger}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 active:scale-[0.97]"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Accordion Section */}
                  <div className="pt-2">
                    <h3 className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wider mb-3 px-1">The Essential ECHO FAQs</h3>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden divide-y divide-[#f5f5f7] dark:divide-neutral-700">
                      {ECHO_FAQS.map((faq, idx) => (
                        <div key={idx} className="flex flex-col">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                            className="flex items-center justify-between px-5 py-4 text-left hover:bg-[#fcfcfd] transition-colors focus:outline-none"
                          >
                            <span className="text-sm font-semibold text-[#1d1d1f] pr-4">{faq.question}</span>
                            <motion.svg
                              animate={{ rotate: expandedFaq === idx ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-4 h-4 text-[#86868b] flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </motion.svg>
                          </button>
                          <AnimatePresence>
                            {expandedFaq === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-4 pt-1">
                                  <p className="text-[13px] leading-relaxed text-[#86868b]">{faq.answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* MOBILE BOTTOM NAVIGATION BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-[#e8e8ed] dark:border-neutral-700 py-2 px-6 flex justify-around md:hidden">
            <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="text-[10px] font-medium">Home</span>
            </button>

            <button onClick={() => handleTabChange('analytics')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'analytics' ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <span className="text-[10px] font-medium">Analytics</span>
            </button>

            <button onClick={() => handleTabChange('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
