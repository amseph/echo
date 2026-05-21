import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ActionBottomSheet from './ActionBottomSheet';

export default function Home({
  direction,
  userEmail,
  handleTabChange,
  handleSignOut,
  totalAllowance,
  totalExpenses,
  totalDebt,
  netBalance,
  dailyAverageSpend,
  daysRemaining,
  transactions,
  handleDeleteTransaction,
  theme,
  formData,
  setFormData,
  handleTypeChange,
  handleSubmit,
  customCategory,
  setCustomCategory,
  loading,
  scanning,
  receiptInputRef,
  handleReceiptScan,
  message,
  chartData,
  isMounted,
  getAllowanceCycle,
  getBrokeDateText,
  getVibeStrings,
}: any) {
  const homeBurnPct = totalAllowance > 0 ? Math.min(Math.round((totalExpenses / totalAllowance) * 100), 100) : 0;
  const homeDaysAgo = new Date(); homeDaysAgo.setDate(homeDaysAgo.getDate() - 7);
  const homeRecent = transactions.filter((t: any) => t.transaction_type === 'expense' && new Date(t.transaction_date) >= homeDaysAgo);
  const homeAvgSpend = homeRecent.reduce((s: any, t: any) => s + Number(t.amount), 0) / 7;
  const homeDaysRemaining = homeAvgSpend > 0 ? Math.floor(netBalance / homeAvgSpend) : null;
  const homeBrokeText = getBrokeDateText(homeDaysRemaining, netBalance);
  const { title: homeVibeTitle, desc: homeVibeDesc } = getVibeStrings(homeBurnPct);
  const isCritical = netBalance <= 0 || homeBrokeText.includes('Today') || homeBrokeText.includes('Tomorrow');

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const openSheet = (type: string) => {
    handleTypeChange(type);
    setIsSheetOpen(true);
  };

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
    <>
      <motion.div key="home" custom={direction} variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }} className="mx-auto max-w-5xl space-y-5 pb-24">
      {/* HEADER */}
      <div 
        className="bg-gradient-to-br from-[#1d2d2a] to-[#2a453e] rounded-3xl px-6 py-5 flex items-center justify-between"
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
          <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Allowance</p>
          <p className="text-xl font-bold text-[#1d2d2a] mt-1">₱{totalAllowance.toFixed(2)}</p>
          <p className="text-[10px] text-green-500 dark:text-emerald-400 mt-1 font-medium">● Inflow this cycle</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Expenses</p>
          <p className="text-xl font-bold text-[#1d1d1f] dark:text-neutral-100 mt-1">₱{totalExpenses.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-1 font-medium">{homeBurnPct}% of budget</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${totalDebt > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700'}`}>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Debt</p>
          <p className="text-xl font-bold text-amber-700 mt-1">₱{totalDebt.toFixed(2)}</p>
          <p className="text-[10px] text-amber-500 mt-1 font-medium">{totalDebt > 0 ? '⚠ Outstanding' : '● Clear'}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${netBalance <= 0 ? 'bg-red-50 border-red-200' : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700'}`}>
          <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Net Balance</p>
          <p className={`text-xl font-bold mt-1 ${netBalance <= 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>₱{netBalance.toFixed(2)}</p>
          <p className={`text-[10px] mt-1 font-medium ${netBalance <= 0 ? 'text-red-400' : 'text-blue-400'}`}>{netBalance <= 0 ? '● Deficit' : '● Available'}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`rounded-2xl border shadow-sm p-4 ${daysRemaining !== null && daysRemaining <= 3 ? 'bg-red-50 border-red-200' : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700'}`}>
          <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Runway</p>
          <p className={`text-xl font-bold mt-1 ${daysRemaining === null || netBalance <= 0 ? 'text-gray-300 dark:text-neutral-500' : daysRemaining <= 3 ? 'text-red-500' : 'text-[#1d1d1f] dark:text-neutral-100'}`}>
            {daysRemaining === null || netBalance <= 0 ? '—' : `${daysRemaining}d`}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-1 font-medium">₱{dailyAverageSpend.toFixed(0)}/day avg</p>
        </motion.div>
      </div>

      {/* PREDICTIVE INSIGHT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 ${isCritical ? 'bg-red-50 border-red-200' : 'bg-[#1d2d2a]/5 border-[#1d2d2a]/10'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-neutral-400 mb-1">Predicted Broke Date</p>
          <p className={`text-2xl font-bold tracking-tight ${isCritical ? 'text-red-500' : 'text-[#1d1d1f] dark:text-neutral-100'}`}>{homeBrokeText}</p>
          <p className="text-[10px] text-[#86868b] dark:text-neutral-400 mt-1">Based on 7-day spending velocity</p>
        </div>
        <div className={`rounded-2xl border p-4 ${homeBurnPct >= 85 ? 'bg-red-50 border-red-300' : homeBurnPct >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-[#f5f5f7] dark:bg-neutral-900 border-[#e8e8ed] dark:border-neutral-700'}`}>
          <p className="text-base font-bold text-[#1d1d1f] dark:text-neutral-100 mb-0.5">{homeVibeTitle}</p>
          <p className="text-xs text-[#424245] dark:text-neutral-300 leading-relaxed">{homeVibeDesc}</p>
          {totalDebt > 0 && <p className="text-[11px] font-medium text-amber-600 mt-2 pt-2 border-t border-amber-200">⚠️ Utang Alert: You owe ₱{totalDebt.toFixed(2)}. Clear this soon!</p>}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: QUICK ACTIONS + CHART */}
        <div className="lg:col-span-7 space-y-5">
          {/* ── Quick Action Triggers ── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => openSheet('expense')}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5 text-left group hover:border-red-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-neutral-100">Add Expense</p>
                  <p className="text-[10px] text-[#86868b] dark:text-neutral-400">Log a purchase</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => openSheet('allowance')}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5 text-left group hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-neutral-100">Add Income</p>
                  <p className="text-[10px] text-[#86868b] dark:text-neutral-400">Record allowance</p>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Message toast from last submission */}
          {message.text && (
            <div className={`p-3 rounded-xl text-xs text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* CHART */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-neutral-100 tracking-tight mb-3">Expense Distribution</h2>
            {isMounted && chartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
                        {chartData.map((_: any, index: number) => <Cell key={index} fill={['#1d2d2a', '#2d4a3e', '#b7e887', '#86c46a', '#5a8f4a'][index % 5]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₱${Number(v).toFixed(2)}`} contentStyle={{ backgroundColor: theme === 'dark' ? '#262626' : '#fff', borderColor: theme === 'dark' ? '#404040' : '#e5e7eb', color: theme === 'dark' ? '#f5f5f5' : '#171717', borderRadius: '0.75rem' }} itemStyle={{ color: theme === 'dark' ? '#f5f5f5' : '#171717' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {chartData.map((entry: any, i: number) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#1d2d2a', '#2d4a3e', '#b7e887', '#86c46a', '#5a8f4a'][i % 5] }} />
                        <span className="text-[#424245] dark:text-neutral-300 truncate">{entry.name}</span>
                      </div>
                      <span className="font-bold text-[#1d1d1f] dark:text-neutral-100 flex-shrink-0">₱{entry.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-neutral-400 text-center py-10">Log expenses to generate distribution.</p>
            )}
          </div>
        </div>
        {/* RIGHT: LEDGER */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-5 max-h-[640px] overflow-y-auto">
          <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-3 sticky top-0 bg-white dark:bg-neutral-800 pb-2 border-b border-gray-100 dark:border-neutral-700">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-neutral-400 text-center py-10">No transactions yet.</p>
          ) : (
            <motion.div className="space-y-1" variants={listContainer} initial="hidden" animate="visible">
              <AnimatePresence>
                {transactions.map((tx: any) => {
                  const isInflow = tx.transaction_type === 'allowance' || tx.transaction_type === 'shortage_request' || tx.transaction_type === 'debt';
                  const isDebtPay = tx.transaction_type === 'debt_payment';
                  return (
                    <motion.div key={tx.id} variants={listItem} exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-neutral-700 last:border-0 group">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-[#1d1d1f] dark:text-neutral-100 truncate">{isDebtPay ? 'Paid Back Loan (Soli)' : tx.expense_category}</p>
                        <p className="text-[10px] text-[#86868b] dark:text-neutral-400">{tx.transaction_date} · {tx.allowance_cycle}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isInflow ? 'text-green-600 dark:text-emerald-400' : 'text-[#1d1d1f] dark:text-neutral-100'}`}>
                            {isDebtPay ? `−₱${parseFloat(tx.amount).toFixed(2)}` : `${isInflow ? '+' : '−'}₱${parseFloat(tx.amount).toFixed(2)}`}
                          </p>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[#86868b] dark:text-neutral-400">{isDebtPay ? 'Settlement' : tx.transaction_type.replace('_', ' ')}</p>
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

      {/* ── ACTION BOTTOM SHEET ── */}
      <ActionBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        formData={formData}
        setFormData={setFormData}
        handleTypeChange={handleTypeChange}
        handleSubmit={handleSubmit}
        customCategory={customCategory}
        setCustomCategory={setCustomCategory}
        loading={loading}
        scanning={scanning}
        receiptInputRef={receiptInputRef}
        handleReceiptScan={handleReceiptScan}
        getAllowanceCycle={getAllowanceCycle}
      />
    </>
  );
}
