'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Adjust this path if your supabase client is located elsewhere

export default function AuthPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // This prevents Supabase from forcing email confirmation links during development
                        emailRedirectTo: window.location.origin,
                    },
                });
                if (error) throw error;
                setSuccessMsg('Account created successfully! You can now log in.');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Redirect to your main dashboard upon successful authentication
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 font-sans antialiased text-[#1d1d1f]">
            <div className="w-full max-w-[400px] rounded-3xl border border-[#e8e8ed] bg-white p-8 shadow-sm">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">ECHO</h1>
                    <p className="mt-2 text-sm text-[#86868b]">
                        {isSignUp ? 'Create an account to start observing habits' : 'Sign in to access your cashflow records'}
                    </p>
                </div>

                {/* Dynamic Alerts */}
                {errorMsg && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-600">
                        {successMsg}
                    </div>
                )}

                {/* Input Fields Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm placeholder-[#86868b] outline-none transition-all duration-200 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#86868b] mb-1 pl-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm placeholder-[#86868b] outline-none transition-all duration-200 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-xl bg-[#0071e3] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                {/* View Switcher Divider */}
                <div className="mt-6 border-t border-[#e8e8ed] pt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}
                        className="text-xs font-medium text-[#0071e3] hover:underline outline-none"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'New to ECHO? Create an account'}
                    </button>
                </div>
            </div>
        </div>
    );
}