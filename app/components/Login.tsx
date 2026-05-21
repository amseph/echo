import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange, options }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Floating Menu Card */}
      <div
        className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-xl border border-neutral-100 transition-all duration-200 ease-out origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="py-2">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
              className="flex w-full items-center px-4 py-3 text-sm text-neutral-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 text-left"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Login({
  handleInitializeCycle,
  cycleType,
  setCycleType,
  initialAllowance,
  setInitialAllowance,
  initialCategory,
  setInitialCategory
}: any) {
  const cycleOptions = [
    { value: 'weekly', label: 'Weekly (Resets Mondays)' },
    { value: 'semi-monthly', label: 'Semi-Monthly (1st & 15th)' },
    { value: 'monthly', label: 'Monthly (Calendar Month)' }
  ];

  const categoryOptions = [
    { value: 'Regular Weekly Allowance', label: 'Regular Weekly Allowance' },
    { value: 'Parents / Family', label: 'Parents / Family' },
    { value: 'Scholarship / Stipend', label: 'Scholarship / Stipend' },
    { value: 'Other Income', label: 'Other Income' }
  ];

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
              <CustomSelect
                value={cycleType}
                onChange={(e: any) => setCycleType(e.target.value)}
                options={cycleOptions}
              />
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
              <CustomSelect
                value={initialCategory}
                onChange={(e: any) => setInitialCategory(e.target.value)}
                options={categoryOptions}
              />
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
