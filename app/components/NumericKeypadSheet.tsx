'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NumericKeypadSheetProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  label?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function NumericKeypadSheet({
  isOpen,
  value,
  onChange,
  onClose,
  label = 'Enter Amount',
}: NumericKeypadSheetProps) {

  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      // Block duplicate decimals
      if (!value.includes('.')) {
        onChange(value === '' ? '0.' : value + '.');
      }
    } else {
      // Prevent leading zeros (e.g. "007")
      if (value === '0') {
        onChange(key);
      } else {
        // Cap to 2 decimal places
        const parts = value.split('.');
        if (parts[1] !== undefined && parts[1].length >= 2) return;
        onChange(value + key);
      }
    }
  };

  // Close on Escape key
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const displayValue = value === '' ? '0.00' : value;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── BACKDROP ── */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* ── BOTTOM SHEET ── */}
          <motion.div
            key="sheet"
            className="fixed inset-x-0 bottom-0 z-50 bg-neutral-950 border-t border-emerald-900/40 rounded-t-[2.5rem] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-neutral-700" />
            </div>

            {/* Label + live display */}
            <div className="px-6 pt-3 pb-2 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600/70 mb-1">{label}</p>
              <p className="text-4xl font-bold text-white tracking-tight tabular-nums">
                ₱{displayValue}
              </p>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 px-8 pt-4 pb-4 max-w-sm mx-auto">
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onPointerDown={() => handleKey(key)}
                  className={`
                    aspect-square flex items-center justify-center rounded-full text-2xl font-medium
                    transition-all duration-100 select-none
                    ${key === '⌫'
                      ? 'bg-neutral-800 text-emerald-400 active:bg-emerald-900/40 active:scale-95'
                      : 'bg-neutral-900 text-white active:bg-emerald-900/40 active:scale-95'
                    }
                  `}
                >
                  {key === '⌫' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                    </svg>
                  ) : key}
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <div className="px-8 pb-8 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Confirm ₱{displayValue}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
