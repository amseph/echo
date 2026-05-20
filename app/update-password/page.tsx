'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            router.push('/login');
            router.refresh();
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 font-sans antialiased text-[#1d1d1f]">
            <div className="w-full max-w-[400px] rounded-3xl border border-[#e8e8ed] bg-white p-8 shadow-sm transition-all duration-300">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Update Password</h1>
                    <p className="mt-2 text-sm text-[#86868b]">
                        Enter your new password below.
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm placeholder-[#86868b] outline-none transition-all duration-200 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-xl bg-[#0071e3] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
