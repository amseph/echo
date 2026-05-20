'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // New state to trigger the check-email screen
    const [showEmailCheck, setShowEmailCheck] = useState(false);
    const [showReset, setShowReset] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                });
                if (error) throw error;

                // Instead of redirecting, freeze the UI and show the custom message
                setShowEmailCheck(true);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:3000/update-password',
            });
            if (error) throw error;

            setShowEmailCheck(true);
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 font-sans antialiased text-[#1d1d1f]">
            <div className="w-full max-w-[400px] rounded-3xl border border-[#e8e8ed] bg-white p-8 shadow-sm transition-all duration-300">

                {/* CONDITION 1: Show this screen ONLY right after a successful signup or reset request */}
                {showEmailCheck ? (
                    <div className="text-center py-4">
                        {/* Minimalist Mail Icon */}
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#0071e3]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Check your email</h1>
                        <p className="mt-3 text-sm leading-relaxed text-[#86868b]">
                            We sent a link to <span className="font-medium text-[#1d1d1f]">{email}</span>. Please check your inbox.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setShowEmailCheck(false);
                                setIsSignUp(false);
                                setShowReset(false);
                                setEmail('');
                                setPassword('');
                            }}
                            className="mt-8 w-full rounded-xl bg-[#0071e3] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#0077ed]"
                        >
                            Back to Sign In
                        </button>
                    </div>

                ) : showReset ? (

                    /* CONDITION 2: Forgot Password View */
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Reset Password</h1>
                            <p className="mt-2 text-sm text-[#86868b]">
                                Enter your email to receive a reset link.
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4">
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-xl bg-[#0071e3] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-[#e8e8ed] pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReset(false);
                                    setErrorMsg('');
                                }}
                                className="text-xs font-medium text-[#0071e3] hover:underline outline-none"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </>

                ) : (

                    /* CONDITION 3: Normal Login / Signup State Forms */
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">ECHO</h1>
                            <p className="mt-2 text-sm text-[#86868b]">
                                {isSignUp ? 'Create an account to start observing habits' : 'Sign in to access your cashflow records'}
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                {errorMsg}
                            </div>
                        )}

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
                                <div className="flex items-center justify-between mb-1 pl-1 pr-1">
                                    <label className="block text-xs font-medium text-[#86868b]">Password</label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowReset(true);
                                                setErrorMsg('');
                                            }}
                                            className="text-xs font-medium text-[#0071e3] hover:underline outline-none"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
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

                        <div className="mt-6 border-t border-[#e8e8ed] pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setErrorMsg('');
                                }}
                                className="text-xs font-medium text-[#0071e3] hover:underline outline-none"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : 'New to ECHO? Create an account'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}