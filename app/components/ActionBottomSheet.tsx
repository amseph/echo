'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Category option maps ──
const CATEGORY_MAP: Record<string, { value: string; label: string }[]> = {
  expense: [
    { value: 'Food', label: 'Food' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Education / Supplies', label: 'Education / Supplies' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Utilities / Bills', label: 'Utilities / Bills' },
    { value: 'Other', label: 'Other' },
  ],
  allowance: [
    { value: 'Regular Weekly Allowance', label: 'Regular Weekly Allowance' },
    { value: 'Parents / Family', label: 'Parents / Family' },
    { value: 'Scholarship / Stipend', label: 'Scholarship / Stipend' },
    { value: 'Other Income', label: 'Other Income' },
    { value: 'debt_payment', label: 'Pay Back Debt (Bayad Utang)' },
  ],
  shortage_request: [
    { value: 'Emergency / Shortage', label: 'Emergency / Shortage' },
    { value: 'Food Shortage', label: 'Food Shortage' },
    { value: 'Transport Shortage', label: 'Transport Shortage' },
  ],
  debt: [],
};

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense', icon: '↗' },
  { value: 'allowance', label: 'Allowance', icon: '↙' },
  { value: 'shortage_request', label: 'Shortage', icon: '⚡' },
  { value: 'debt', label: 'Debt', icon: '⚠' },
];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

// ── Inline Custom Dropdown ──
function SheetDropdown({ value, options, onChange }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl bg-neutral-800/80 border border-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-all"
      >
        <span>{selected?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl bg-neutral-800 shadow-xl border border-white/10 transition-all duration-200 ease-out origin-top ${
          open ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors text-left ${
                opt.value === value ? 'text-emerald-400 bg-emerald-900/20' : 'text-white/80 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Bottom Sheet ──
interface ActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (fn: any) => void;
  handleTypeChange: (type: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  customCategory: string;
  setCustomCategory: (val: string) => void;
  loading: boolean;
  scanning: boolean;
  receiptInputRef: React.RefObject<HTMLInputElement | null>;
  handleReceiptScan: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getAllowanceCycle: (d: string) => string;
}

export default function ActionBottomSheet({
  isOpen,
  onClose,
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
  getAllowanceCycle,
}: ActionBottomSheetProps) {
  const [step, setStep] = useState<'keypad' | 'details'>('keypad');

  // Reset step when sheet opens
  useEffect(() => {
    if (isOpen) setStep('keypad');
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const amount = formData.amount || '';
  const displayAmount = amount === '' ? '0.00' : amount;

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setFormData((prev: any) => ({ ...prev, amount: amount.slice(0, -1) }));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setFormData((prev: any) => ({ ...prev, amount: amount === '' ? '0.' : amount + '.' }));
      }
    } else {
      if (amount === '0') {
        setFormData((prev: any) => ({ ...prev, amount: key }));
      } else {
        const parts = amount.split('.');
        if (parts[1] !== undefined && parts[1].length >= 2) return;
        setFormData((prev: any) => ({ ...prev, amount: amount + key }));
      }
    }
  };

  const categoryOptions = CATEGORY_MAP[formData.transaction_type] || CATEGORY_MAP.expense;
  const isDebt = formData.transaction_type === 'debt';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── BACKDROP ── */}
          <motion.div
            key="action-backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* ── BOTTOM SHEET ── */}
          <motion.div
            key="action-sheet"
            className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto" />
            </div>

            <AnimatePresence mode="wait">
              {step === 'keypad' ? (
                <motion.div
                  key="keypad-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ── Type Selector Chips ── */}
                  <div className="flex items-center justify-center gap-2 px-6 pt-2 pb-3">
                    {TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleTypeChange(opt.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          formData.transaction_type === opt.value
                            ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/40'
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* ── Giant Amount Readout ── */}
                  <div className="px-6 pt-2 pb-1 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600/60 mb-1">
                      {formData.transaction_type === 'expense' ? 'Expense' :
                       formData.transaction_type === 'allowance' ? 'Income' :
                       formData.transaction_type === 'debt' ? 'Debt' : 'Shortage'}
                    </p>
                    <p className="text-5xl font-bold text-white tracking-tight tabular-nums">
                      <span className="text-emerald-500 text-3xl mr-1">₱</span>{displayAmount}
                    </p>
                  </div>

                  {/* ── Keypad Grid ── */}
                  <div className="grid grid-cols-3 gap-3 px-8 pt-4 pb-4 max-w-sm mx-auto">
                    {KEYS.map(key => (
                      <button
                        key={key}
                        type="button"
                        onPointerDown={() => handleKey(key)}
                        className={`aspect-square flex items-center justify-center rounded-full text-2xl font-medium transition-all duration-100 select-none ${
                          key === '⌫'
                            ? 'bg-neutral-800 text-emerald-400 active:bg-emerald-900/40 active:scale-95'
                            : 'bg-neutral-900 text-white active:bg-emerald-900/40 active:scale-95'
                        }`}
                      >
                        {key === '⌫' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                          </svg>
                        ) : key}
                      </button>
                    ))}
                  </div>

                  {/* ── Receipt Scan + Next Button ── */}
                  <div className="flex items-center gap-3 px-8 pb-8 pt-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() => receiptInputRef.current?.click()}
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-40"
                      title="Scan receipt"
                    >
                      {scanning ? (
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
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
                    <button
                      type="button"
                      disabled={!amount || amount === '0' || amount === '0.'}
                      onClick={() => setStep('details')}
                      className="flex-1 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next — Set Details
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="details-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pt-2 pb-8"
                >
                  {/* ── Amount Summary ── */}
                  <div className="text-center mb-5">
                    <p className="text-3xl font-bold text-white tabular-nums">
                      <span className="text-emerald-500 text-xl mr-1">₱</span>{displayAmount}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep('keypad')}
                      className="mt-1 text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                    >
                      ← Edit amount
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-3 max-w-sm mx-auto">
                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-1.5 pl-1">Date</label>
                      <input
                        type="date"
                        required
                        value={formData.transaction_date}
                        onChange={(e) => {
                          const d = e.target.value;
                          setFormData((prev: any) => ({ ...prev, transaction_date: d, allowance_cycle: getAllowanceCycle(d) }));
                        }}
                        className="w-full px-4 py-2.5 rounded-2xl bg-neutral-800/80 border border-white/5 text-sm text-white/90 outline-none transition-all focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Category */}
                    {isDebt ? (
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-1.5 pl-1">Lender</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Juan, Aling Nena"
                          value={formData.expense_category}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, expense_category: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-2xl bg-neutral-800/80 border border-white/5 text-sm text-white/90 placeholder-neutral-600 outline-none transition-all focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-1.5 pl-1">Category</label>
                        <SheetDropdown
                          value={formData.expense_category}
                          options={categoryOptions}
                          onChange={(val) => setFormData((prev: any) => ({ ...prev, expense_category: val }))}
                        />
                      </div>
                    )}

                    {/* Custom category */}
                    {formData.expense_category === 'Other' && (
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-1.5 pl-1">Specify</label>
                        <input
                          type="text"
                          required
                          placeholder="Specify category"
                          maxLength={25}
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-neutral-800/80 border border-white/5 text-sm text-white/90 placeholder-neutral-600 outline-none transition-all focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    )}

                    {/* Cycle badge */}
                    <div className="flex items-center justify-center pt-1">
                      <span className="text-[10px] text-neutral-500 bg-neutral-800/60 rounded-lg px-2.5 py-1 font-medium">
                        {formData.allowance_cycle}
                      </span>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving…' : `Record ₱${displayAmount}`}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
