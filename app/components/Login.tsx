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
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 font-sans antialiased animate-fadeIn">
      {/* ── GRADIENT HEADER ── */}
      <div className="relative flex flex-col items-center justify-end bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-950 px-6 pt-28 pb-16 text-center">
        {/* We keep this area clean to let the card stand out, or you could move the title here */}
      </div>

      {/* ── FORM CARD ── overlaps gradient by pulling up with negative margin */}
      <div className="relative z-10 -mt-6 flex-1 rounded-t-[2.5rem] bg-white px-6 pt-10 pb-10 shadow-2xl overflow-y-auto">
        <div className="mx-auto w-full max-w-[440px] text-center">
          
          <img src="/icon-512.png" className="w-16 h-16 mx-auto mb-2" alt="ECHO Logo" />
          
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">Welcome to ECHO</h2>
          <p className="mt-2 mb-8 text-sm leading-relaxed text-neutral-500">
            Let’s initialize your tracking cycle. Enter your current starting allowance or pocket money to unlock your dashboard.
          </p>

          <form onSubmit={handleInitializeCycle} className="space-y-5">
            <div className="text-left">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 pl-1">Budget Cycle</label>
              <select
                value={cycleType}
                onChange={(e) => setCycleType(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="weekly">Weekly (Resets Mondays)</option>
                <option value="semi-monthly">Semi-Monthly (1st &amp; 15th)</option>
                <option value="monthly">Monthly (Calendar Month)</option>
              </select>
            </div>

            <div className="text-left">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 pl-1">Starting Amount (₱)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={initialAllowance}
                onChange={(e) => setInitialAllowance(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="text-left">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 pl-1">Category</label>
              <select
                value={initialCategory}
                onChange={(e) => setInitialCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Regular Weekly Allowance">Regular Weekly Allowance</option>
                <option value="Parents / Family">Parents / Family</option>
                <option value="Scholarship / Stipend">Scholarship / Stipend</option>
                <option value="Other Income">Other Income</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              Activate Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
