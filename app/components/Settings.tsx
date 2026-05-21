import React from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';

export const ECHO_FAQS = [
  { question: "What is the \"Predicted Broke Date\" or \"Runway\"?", answer: "It calculates exactly how many days your remaining allowance will last based on your real spending velocity over the past 7 days. If you haven't spent anything, it defaults to an \"Infinite Runway.\"" },
  { question: "What does \"Pure Hermit Mode\" mean?", answer: "This is a special status triggered automatically when you haven't logged a single expense for the current cycle. It means your budget is 100% intact!" },
  { question: "Why did the Receipt Scanner get the wrong amount?", answer: "Dot-matrix or blurry receipts can sometimes cause the AI text reader to misalign lines. If it misreads a digit, don't worry—the scanner only pre-fills the box. You can manually tap the input field to correct the amount before hitting record." },
  { question: "Can I delete an incorrect transaction?", answer: "Yes. If you make a typo or accidentally record a scan, scroll down to your Transaction History, find the item, and tap the trash icon to wipe it from your ledger instantly." },
  { question: "How do I change my tracking period?", answer: "In the Settings tab, look for the Allowance Cycle dropdown. You can switch between a Weekly or Monthly cadence to match how you actually receive your money." },
  { question: "How do I start a completely fresh cycle?", answer: "If you want to clear your testing data or start over, go to Settings and use the Reset Ledger Data button. This permanently wipes your history so you can begin fresh." }
];

export default function Settings({
  direction,
  handleTabChange,
  cyclePreference,
  handleCycleChange,
  toneMode,
  handleToneChange,
  theme,
  handleThemeChange,
  userEmail,
  handleSignOut,
  handleResetLedger,
  expandedFaq,
  setExpandedFaq,
}: any) {
  const tabVariants: Variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 20 : -20 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
  };

  return (
    <motion.div key="settings" custom={direction} variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }} className="max-w-md mx-auto space-y-6 pt-4 pb-24">

      {/* Title Block */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-neutral-100">Settings</h2>
        <button
          onClick={() => handleTabChange('home')}
          className="text-xs font-medium text-[#0071e3] hover:underline"
        >
          Done
        </button>
      </div>

      {/* Preference Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-neutral-700">
          <div>
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Allowance Cycle</p>
            <p className="text-xs text-[#86868b] dark:text-neutral-400 mt-0.5">Controls how your metrics reset</p>
          </div>
          <select
            value={cyclePreference}
            onChange={(e) => handleCycleChange(e.target.value)}
            className="rounded-lg border border-[#d2d2d7] dark:border-neutral-600 bg-[#f5f5f7] dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] dark:text-neutral-100 outline-none transition-all focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
          >
            <option value="Weekly">Weekly</option>
            <option value="Semi-Monthly">Semi-Monthly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>

        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-neutral-700">
          <div>
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Personality Tone</p>
            <p className="text-xs text-[#86868b] dark:text-neutral-400 mt-0.5">Coach (Encouraging) vs Roast (Insulting)</p>
          </div>
          <div className="flex bg-[#f5f5f7] dark:bg-neutral-900 p-1 rounded-lg border border-[#d2d2d7] dark:border-neutral-600">
            <button
              onClick={() => handleToneChange('Coach')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${toneMode === 'Coach' ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400 hover:text-[#1d1d1f] dark:text-neutral-100'}`}
            >
              Coach
            </button>
            <button
              onClick={() => handleToneChange('Roast')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${toneMode === 'Roast' ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400 hover:text-[#1d1d1f] dark:text-neutral-100'}`}
            >
              Roast
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">Appearance</p>
            <p className="text-xs text-[#86868b] dark:text-neutral-400 mt-0.5">Switch between light and dark mode</p>
          </div>
          <div className="flex bg-[#f5f5f7] dark:bg-neutral-700 p-1 rounded-lg border border-[#d2d2d7] dark:border-neutral-600">
            <button
              onClick={() => handleThemeChange('light')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#1d1d1f] dark:text-neutral-100' : 'text-[#86868b] dark:text-neutral-400 hover:text-[#1d1d1f] dark:hover:text-white'}`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-neutral-800 shadow-sm text-white' : 'text-[#86868b] dark:text-neutral-400 hover:text-[#1d1d1f] dark:text-neutral-100'}`}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] dark:bg-neutral-900 text-[#86868b] dark:text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-neutral-100">Account</p>
            <p className="text-xs text-[#86868b] dark:text-neutral-400 truncate">{userEmail || '—'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-[#86868b] dark:text-neutral-400 hover:text-[#1d1d1f] dark:text-neutral-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Reset Ledger Data</p>
              <p className="text-xs text-[#86868b] dark:text-neutral-400 mt-0.5">Wipe all transaction history to start a fresh cycle.</p>
            </div>
            <button
              onClick={handleResetLedger}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 active:scale-[0.97]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="pt-2">
        <h3 className="text-[13px] font-semibold text-[#86868b] dark:text-neutral-400 uppercase tracking-wider mb-3 px-1">The Essential ECHO FAQs</h3>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#e8e8ed] dark:border-neutral-700 shadow-sm overflow-hidden divide-y divide-[#f5f5f7] dark:divide-neutral-700">
          {ECHO_FAQS.map((faq, idx) => (
            <div key={idx} className="flex flex-col">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="flex items-center justify-between px-5 py-4 text-left hover:bg-[#fcfcfd] dark:bg-neutral-700 transition-colors focus:outline-none"
              >
                <span className="text-sm font-semibold text-[#1d1d1f] dark:text-neutral-100 pr-4">{faq.question}</span>
                <motion.svg
                  animate={{ rotate: expandedFaq === idx ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-[#86868b] dark:text-neutral-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {expandedFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1">
                      <p className="text-[13px] leading-relaxed text-[#86868b] dark:text-neutral-400">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
