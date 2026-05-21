'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, disabled = false, className = '' }: any) {
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
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5 rounded-xl border border-[#d2d2d7] dark:border-neutral-600 text-sm bg-white dark:bg-neutral-800 text-[#1d1d1f] dark:text-neutral-100 outline-none focus:border-[#1d2d2a] focus:ring-1 focus:ring-[#1d2d2a] transition-all"
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
        className={`absolute z-50 mt-1 w-full overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-100 dark:border-neutral-700 transition-all duration-200 ease-out origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="py-2 max-h-60 overflow-y-auto">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors text-left ${
                value === opt.value
                  ? 'bg-[#1d2d2a]/10 dark:bg-emerald-900/40 text-[#1d2d2a] dark:text-emerald-400 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 hover:text-neutral-900 dark:hover:text-neutral-100'
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
