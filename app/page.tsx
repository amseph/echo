'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Tesseract from 'tesseract.js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Login from './components/Login';
import HomeView from './components/Home';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

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

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

      const { data, error } = await supabase
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
        ])
        .select()
        .single();

      if (!error) {
        setInitialAllowance('');
        setInitialCategory('Parents / Family');
        localStorage.setItem('echo_allowance_cycle', cycleType);
        if (data) {
          setTransactions([data]);
        }
        setLoading(false);
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

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const categoryToSend = formData.expense_category === 'Other' ? customCategory : formData.expense_category;
      const transactionType = formData.expense_category === 'debt_payment' ? 'debt_payment' : formData.transaction_type;
      const amount = formData.amount;

      if (transactionType === 'debt_payment') {
        if (parseFloat(amount) > totalDebt) {
          showToast(`Validation Error: You cannot pay back more than your current total debt of ₱${totalDebt.toFixed(2)}.`, 'error');
          setSubmitting(false);
          return; // Kill execution early
        }

        if (parseFloat(amount) > netBalance) {
          showToast(`Validation Error: Insufficient funds. Your current net balance is ₱${netBalance.toFixed(2)}, you cannot afford this payment.`, 'error');
          setSubmitting(false);
          return; // Kill execution early
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user?.id,
            transaction_date: formData.transaction_date,
            transaction_type: transactionType,
            amount: Number(amount),
            expense_category: categoryToSend,
            allowance_cycle: formData.allowance_cycle,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Transaction recorded!' });

      // Reset amount and customCategory but preserve type, category, and cycle for rapid entry
      setFormData(prev => ({ ...prev, amount: '' }));
      setCustomCategory('');
      if (data) {
        setTransactions(prev => [data, ...prev]);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
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
                <h3 className="text-sm font-bold text-neutral-900">Delete Transaction?</h3>
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
          <div className="flex items-start justify-between border-b border-[#e8e8ed] dark:border-neutral-700 pb-6 mb-8">
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
                <div className="h-3 w-16 bg-[#f5f5f7] dark:bg-neutral-900 rounded-md" />
                <div className="h-5 w-24 bg-[#f5f5f7] dark:bg-neutral-900 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
        /* Case 2: User is logged in but has a clean slate (Onboarding View) */
        <Login
          handleInitializeCycle={handleInitializeCycle}
          cycleType={cycleType}
          setCycleType={setCycleType}
          initialAllowance={initialAllowance}
          setInitialAllowance={setInitialAllowance}
          initialCategory={initialCategory}
          setInitialCategory={setInitialCategory}
        />
      ) : (
        /* Case 3: Redesigned dashboard */
        <>
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === 'home' && (
              <HomeView
                direction={direction}
                userEmail={userEmail}
                handleTabChange={handleTabChange}
                handleSignOut={handleSignOut}
                totalAllowance={totalAllowance}
                totalExpenses={totalExpenses}
                totalDebt={totalDebt}
                netBalance={netBalance}
                dailyAverageSpend={dailyAverageSpend}
                daysRemaining={daysRemaining}
                transactions={transactions}
                handleDeleteTransaction={handleDeleteTransaction}
                theme={theme}
                formData={formData}
                setFormData={setFormData}
                handleTypeChange={handleTypeChange}
                handleSubmit={handleSubmit}
                customCategory={customCategory}
                setCustomCategory={setCustomCategory}
                loading={submitting}
                scanning={scanning}
                receiptInputRef={receiptInputRef}
                handleReceiptScan={handleReceiptScan}
                message={message}
                chartData={chartData}
                isMounted={isMounted}
                getAllowanceCycle={getAllowanceCycle}
                getBrokeDateText={getBrokeDateText}
                getVibeStrings={getVibeStrings}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics
                direction={direction}
                totalAllowance={totalAllowance}
                totalExpenses={totalExpenses}
                totalShortages={totalShortages}
                totalDebt={totalDebt}
                netBalance={netBalance}
                transactions={transactions}
                chartData={chartData}
                theme={theme}
                getBrokeDateText={getBrokeDateText}
                getVibeStrings={getVibeStrings}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                direction={direction}
                handleTabChange={handleTabChange}
                cyclePreference={cyclePreference}
                handleCycleChange={handleCycleChange}
                toneMode={toneMode}
                handleToneChange={handleToneChange}
                theme={theme}
                handleThemeChange={handleThemeChange}
                userEmail={userEmail}
                handleSignOut={handleSignOut}
                handleResetLedger={handleResetLedger}
                expandedFaq={expandedFaq}
                setExpandedFaq={setExpandedFaq}
              />
            )}
          </AnimatePresence>

          {/* MOBILE BOTTOM NAVIGATION BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-[#e8e8ed] dark:border-neutral-700 py-2 px-6 flex justify-around md:hidden">
            <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="text-[10px] font-medium">Home</span>
            </button>

            <button onClick={() => handleTabChange('analytics')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'analytics' ? 'text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <span className="text-[10px] font-medium">Analytics</span>
            </button>

            <button onClick={() => handleTabChange('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400'}`}>
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
