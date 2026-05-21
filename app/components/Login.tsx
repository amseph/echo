import React from 'react';

export default function Login({
  handleInitializeCycle,
  cycleType,
  setCycleType,
  initialAllowance,
  setInitialAllowance,
  initialCategory,
  setInitialCategory
}: any) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-fadeIn">
      <div className="w-full max-w-[440px] rounded-3xl border border-[#e8e8ed] dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-neutral-100">Welcome to ECHO</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#86868b] dark:text-neutral-400">
          Let’s initialize your tracking cycle. Enter your current starting allowance or pocket money to unlock your dashboard.
        </p>

        <form onSubmit={handleInitializeCycle} className="mt-6 space-y-4">
          <div className="text-left">
            <label className="block text-xs font-medium text-[#86868b] dark:text-neutral-400 mb-1 pl-1">Budget Cycle</label>
            <select
              value={cycleType}
              onChange={(e) => setCycleType(e.target.value)}
              className="w-full rounded-xl border border-[#d2d2d7] dark:border-neutral-600 px-4 py-3 text-sm bg-white dark:bg-neutral-800 outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
            >
              <option value="weekly">Weekly (Resets Mondays)</option>
              <option value="semi-monthly">Semi-Monthly (1st &amp; 15th)</option>
              <option value="monthly">Monthly (Calendar Month)</option>
            </select>
          </div>

          <div className="text-left">
            <label className="block text-xs font-medium text-[#86868b] dark:text-neutral-400 mb-1 pl-1">Starting Amount (₱)</label>
            <input
              type="number"
              required
              min="1"
              placeholder="0.00"
              value={initialAllowance}
              onChange={(e) => setInitialAllowance(e.target.value)}
              className="w-full rounded-xl border border-[#d2d2d7] dark:border-neutral-600 px-4 py-3 text-sm placeholder-[#86868b] outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
            />
          </div>

          <div className="text-left">
            <label className="block text-xs font-medium text-[#86868b] dark:text-neutral-400 mb-1 pl-1">Category</label>
            <select
              value={initialCategory}
              onChange={(e) => setInitialCategory(e.target.value)}
              className="w-full rounded-xl border border-[#d2d2d7] dark:border-neutral-600 px-4 py-3 text-sm bg-white dark:bg-neutral-800 outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
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
  );
}
