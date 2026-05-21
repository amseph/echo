import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function Analytics({
  direction,
  totalAllowance,
  totalExpenses,
  totalShortages,
  totalDebt,
  netBalance,
  transactions,
  chartData,
  theme,
  getBrokeDateText,
  getVibeStrings,
}: any) {
  const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB'];

  const burnPercentage = totalAllowance > 0 ? Math.min(Math.round((totalExpenses / totalAllowance) * 100), 100) : 0;
  const topCategory = chartData.length > 0 ? chartData.reduce((a: any, b: any) => a.value > b.value ? a : b) : null;
  const totalInflows = totalAllowance + totalShortages + totalDebt;
  const totalOutflows = totalExpenses;
  const chartTotal = chartData.reduce((sum: any, c: any) => sum + c.value, 0);

  // 1. Calculate Broke Prediction Date
  const sevenDaysAgoCalc = new Date();
  sevenDaysAgoCalc.setDate(sevenDaysAgoCalc.getDate() - 7);
  const recentExpensesCalc = transactions.filter((t: any) => t.transaction_type === 'expense' && new Date(t.transaction_date) >= sevenDaysAgoCalc);
  const totalRecentSpentCalc = recentExpensesCalc.reduce((sum: any, t: any) => sum + Number(t.amount), 0);
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
        <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-neutral-100">Financial Analytics</h2>

        {/* Burn Rate Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Budget Utilization</p>
            <p className={`text-sm font-bold ${burnPercentage >= 70 ? 'text-red-500' : 'text-[#1d1d1f] dark:text-neutral-100'}`}>
              {burnPercentage}%
            </p>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#f5f5f7] dark:bg-neutral-900 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${burnPercentage >= 90 ? 'bg-red-500' : burnPercentage >= 70 ? 'bg-amber-500' : 'bg-[#1d1d1f]'
                }`}
              initial={{ width: 0 }}
              animate={{ width: `${burnPercentage}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <p className="text-xs text-[#86868b] dark:text-neutral-400">
            {burnPercentage}% of your ₱{totalAllowance.toFixed(2)} allowance has been spent this cycle.
          </p>
        </div>

        {/* Spending Distribution Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-4">
          <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Spending Distribution</p>
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
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₱${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: theme === 'dark' ? '#262626' : '#fff', borderColor: theme === 'dark' ? '#404040' : '#e5e7eb', color: theme === 'dark' ? '#f5f5f5' : '#171717', borderRadius: '0.75rem' }} itemStyle={{ color: theme === 'dark' ? '#f5f5f5' : '#171717' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {chartData.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[#1d1d1f] dark:text-neutral-100 font-medium truncate max-w-[140px]">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#86868b] dark:text-neutral-400">{chartTotal > 0 ? Math.round((entry.value / chartTotal) * 100) : 0}%</span>
                      <span className="text-[#1d1d1f] dark:text-neutral-100 font-semibold">₱{entry.value.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#86868b] dark:text-neutral-400 text-center py-8">Log expenses to generate category metrics.</p>
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
          <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Cash Flow Summary</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Total Inflows</p>
              <p className="text-lg font-bold text-green-600 dark:text-emerald-400 mt-1">₱{totalInflows.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Total Outflows</p>
              <p className="text-lg font-bold text-red-500 mt-1">₱{totalOutflows.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f7]">
            <p className="text-xs text-[#86868b] dark:text-neutral-400">Net Balance</p>
            <p className={`text-sm font-bold ${netBalance >= 0 ? 'text-[#1d1d1f] dark:text-white' : 'text-red-500'}`}>
              {netBalance >= 0 ? '+' : ''}₱{netBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Broke Clock Card */}
        <div className="bg-[#f5f5f7] dark:bg-neutral-900 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm p-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[#86868b] dark:text-neutral-400 mb-1">Predicted Broke Date</p>
          <p className={`text-2xl font-bold tracking-tight ${netBalance < totalAllowance * 0.05 || (brokeDateText.includes('Today') || brokeDateText.includes('Tomorrow')) ? 'text-red-500' : 'text-[#1d1d1f] dark:text-neutral-100'}`}>{brokeDateText}</p>
          <p className="text-xs text-[#86868b] dark:text-neutral-400 mt-1">Based on your spending speed over the past 7 days.</p>
        </div>

        {/* Vibe Check Roast Card */}
        <div className="bg-[#f5f5f7] dark:bg-neutral-900 rounded-2xl p-5 border border-[#e8e8ed] dark:border-neutral-700">
          <p className="text-base font-semibold text-[#1d1d1f] dark:text-neutral-100 mb-1">{vibeTitle}</p>
          <p className="text-sm text-[#424245] dark:text-neutral-300 leading-relaxed">{vibeDesc}</p>
          {totalDebt > 0 && (
            <div className="mt-3 pt-2 border-t border-[#e8e8ed] dark:border-neutral-700/60 text-xs font-medium text-amber-600">
              ⚠️ Utang Alert: You owe someone ₱{totalDebt.toFixed(2)}. Reminder: clear this or your karma points will suffer.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
