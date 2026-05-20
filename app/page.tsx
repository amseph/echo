'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [customCategory, setCustomCategory] = useState('');

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

  const initialDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    transaction_date: initialDate,
    transaction_type: 'expense',
    amount: '',
    expense_category: 'Food',
    allowance_cycle: getAllowanceCycle(initialDate), // Auto-calculate on load
  });

  const fetchTransactions = async (userId?: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
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
        // Load current user's isolated transaction data from Supabase rows
        fetchTransactions(session.user.id);
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
          alert(`Validation Error: You cannot pay back more than your current total debt of ₱${totalDebt.toFixed(2)}.`);
          setLoading(false);
          return; // Kill execution early
        }
        
        if (parseFloat(amount) > netBalance) {
          alert(`Validation Error: Insufficient funds. Your current net balance is ₱${netBalance.toFixed(2)}, you cannot afford this payment.`);
          setLoading(false);
          return; // Kill execution early
        }
      }

      const { error } = await supabase.from('transactions').insert([
        {
          transaction_date: formData.transaction_date,
          transaction_type: transactionType,
          amount: parseFloat(amount),
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-4 md:p-12 space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-[#e8e8ed] pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">ECHO</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#86868b]">
            Expense & Cashflow Habit Observer
          </p>
        </div>

        {/* Apple-style Minimalist Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-[#d2d2d7] bg-white px-4 py-2 text-xs font-medium text-[#1d1d1f] shadow-sm transition-all duration-200 hover:bg-[#f5f5f7] active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#86868b]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* METRIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full max-w-4xl">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Allowance</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₱{totalAllowance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Debt</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">₱{totalDebt.toFixed(2)}</p>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm ${netBalance <= 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Balance</p>
          <p className={`text-2xl font-bold mt-1 ${netBalance <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
            ₱{netBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-4xl items-start">

        {/* LEFT COLUMN: FORM & VISUALIZATION */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Form Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Log Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Date <span className="text-gray-400 font-normal ml-1.5">• {formData.allowance_cycle}</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  value={formData.transaction_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData({
                      ...formData,
                      transaction_date: newDate,
                      allowance_cycle: getAllowanceCycle(newDate) // Dynamic calculation!
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                    value={formData.transaction_type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    <option value="expense">Expense</option>
                    <option value="allowance">Allowance</option>
                    <option value="shortage_request">Shortage</option>
                    <option value="debt">Debt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                {/* Clean Dropdown Selector for Categories */}
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {formData.transaction_type === 'debt' ? 'Lender / Source (Kanino / Saan)' : 'Category'}
                </label>
                {formData.transaction_type === 'debt' ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g., Juan, Aling Nena, Canteen"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    value={formData.expense_category}
                    onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                  />
                ) : (
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                    value={formData.expense_category}
                    onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                  >
                    {formData.transaction_type === 'allowance' ? (
                      <>
                        <option value="Regular Weekly Allowance">Regular Weekly Allowance</option>
                        <option value="Parents / Family">Parents / Family</option>
                        <option value="Scholarship / Stipend">Scholarship / Stipend</option>
                        <option value="Other Income">Other Income</option>
                        <option value="debt_payment">Pay Back Debt (Bayad Utang)</option>
                      </>
                    ) : formData.transaction_type === 'shortage_request' ? (
                      <>
                        <option value="Emergency / Shortage">Emergency / Shortage</option>
                        <option value="Food Shortage">Food Shortage</option>
                        <option value="Transport Shortage">Transport Shortage</option>
                      </>
                    ) : (
                      <>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Education / Supplies">Education / Supplies</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Utilities / Bills">Utilities / Bills</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                )}

                {formData.expense_category === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Specify category"
                    maxLength={25}
                    className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Record Transaction'}
              </button>
            </form>

            {message.text && (
              <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Chart Analytics Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Expense Distribution</h2>
            {isMounted && chartData.length > 0 ? (
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
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

                <div className="text-xs space-y-1.5 ml-4">
                  {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-600 font-medium">{entry.name}:</span>
                      <span className="text-gray-900 font-bold">₱{entry.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-12">Log expenses to generate category metrics.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TRANSACTION HISTORY LIST */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full max-h-[580px] overflow-y-auto">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-sm text-[#1d1d1f]">
                      {tx.transaction_type === 'debt_payment' ? 'Paid Back Loan (Soli)' : tx.expense_category}
                    </p>
                    <p className="text-xs text-[#86868b]">{tx.transaction_date} • {tx.allowance_cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      tx.transaction_type === 'allowance' || tx.transaction_type === 'shortage_request' || tx.transaction_type === 'debt'
                        ? 'text-green-600' 
                        : 'text-red-500' // Debt payments reflect a minus status for wallet cashflow
                    }`}>
                      {tx.transaction_type === 'debt_payment' ? `- ₱${parseFloat(tx.amount).toFixed(2)}` : `${tx.transaction_type === 'expense' ? '-' : '+'} ₱${parseFloat(tx.amount).toFixed(2)}`}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#86868b]">
                      {tx.transaction_type === 'debt_payment' ? 'Settlement' : tx.transaction_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
