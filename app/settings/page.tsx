'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/app/components/CustomSelect';

const CYCLE_KEY = 'echo_allowance_cycle';

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [cyclePreference, setCyclePreference] = useState('monthly');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email ?? '');

      const saved = localStorage.getItem(CYCLE_KEY);
      if (saved) setCyclePreference(saved);
    };
    init();
  }, []);

  const handleSaveCycle = () => {
    setSaving(true);
    localStorage.setItem(CYCLE_KEY, cyclePreference);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  const handleResetLedger = async () => {
    setResetting(true);
    setResetError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated.');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      setShowResetModal(false);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setResetError(err.message || 'Something went wrong.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-8 font-sans antialiased text-[#1d1d1f]">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-[#d2d2d7] bg-white shadow-sm transition-all hover:bg-[#e8e8ed] active:scale-95"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#1d1d1f]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Settings</h2>
        </div>

        {/* CYCLE PREFERENCES */}
        <div className="rounded-3xl border border-[#e8e8ed] bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Allowance Cycle Reset</h3>
            <p className="mt-1 text-xs text-[#86868b]">Choose how your metrics are grouped and reset each cycle.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5 pl-1">Cycle Period</label>
            <CustomSelect
              value={cyclePreference}
              onChange={(e: any) => setCyclePreference(e.target.value)}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'semi-monthly', label: 'Semi-Monthly (1st & 15th)' },
                { value: 'monthly', label: 'Monthly (Default)' },
              ]}
            />
          </div>

          <button
            onClick={handleSaveCycle}
            disabled={saving}
            className="w-full rounded-xl bg-[#0071e3] py-2.5 text-sm font-medium text-white transition-all hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
          >
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Preference'}
          </button>
        </div>

        {/* ACCOUNT INFO */}
        <div className="rounded-3xl border border-[#e8e8ed] bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Account</h3>

          <div className="flex items-center justify-between py-3 border-b border-[#f5f5f7]">
            <span className="text-xs font-medium text-[#86868b] uppercase tracking-wider">Email</span>
            <span className="text-sm font-medium text-[#1d1d1f] truncate max-w-[60%] text-right">{userEmail || '—'}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-xs font-medium text-[#86868b] uppercase tracking-wider">Cycle Preference</span>
            <span className="text-sm font-medium text-[#1d1d1f] capitalize">
              {cyclePreference === 'semi-monthly' ? 'Semi-Monthly' : cyclePreference === 'weekly' ? 'Weekly' : 'Monthly'}
            </span>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
          <p className="text-xs text-[#86868b]">Permanently delete all your transaction records. This cannot be undone.</p>

          <button
            onClick={() => { setShowResetModal(true); setResetError(''); }}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]"
          >
            Reset Ledger Data
          </button>
        </div>

      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-[380px] rounded-3xl border border-[#e8e8ed] bg-white p-8 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-[#1d1d1f]">Reset Ledger?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#86868b]">
              This will permanently delete <span className="font-semibold text-[#1d1d1f]">all</span> your transaction records. Your account will remain but your ledger will be wiped clean.
            </p>

            {resetError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {resetError}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 rounded-xl border border-[#d2d2d7] py-2.5 text-sm font-medium text-[#1d1d1f] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetLedger}
                disabled={resetting}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {resetting ? 'Deleting...' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
