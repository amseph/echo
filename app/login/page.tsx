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

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);

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

    // --- Derived header text ---
    const headerTitle = showEmailCheck
        ? 'Check Your Email'
        : showReset
        ? 'Reset Password'
        : isSignUp
        ? 'Create Account'
        : 'Hello, Sign In!';

    const headerSubtitle = showEmailCheck
        ? null
        : showReset
        ? 'Enter your email and we\'ll send a reset link.'
        : isSignUp
        ? 'Start tracking your cashflow habits.'
        : 'Access your personal cashflow records.';

    // Eye icon helper
    const EyeIcon = ({ open }: { open: boolean }) =>
        open ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
        );

    return (
        <div className="flex min-h-screen flex-col bg-neutral-950 font-sans antialiased">

            {/* ── GRADIENT HEADER ── */}
            <div className="relative flex flex-col items-center justify-end bg-gradient-to-br from-rose-950 via-purple-950 to-neutral-900 px-6 pt-16 pb-12 text-center">
                {/* Logo */}
                <img
                    src="/icon-512.png"
                    className="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-lg"
                    alt="ECHO Logo"
                />

                {/* Dynamic heading */}
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    {headerTitle}
                </h1>
                {headerSubtitle && (
                    <p className="mt-1.5 text-sm text-white/50 max-w-[260px]">
                        {headerSubtitle}
                    </p>
                )}
            </div>

            {/* ── FORM CARD ── overlaps gradient by pulling up with negative margin */}
            <div className="relative z-10 -mt-6 flex-1 rounded-t-[2.5rem] bg-white px-6 pt-8 pb-10 shadow-2xl">

                {/* CONDITION 1: Email check / confirmation screen */}
                {showEmailCheck ? (
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>

                        <p className="text-base font-semibold text-neutral-800">Link sent to</p>
                        <p className="mt-1 text-sm font-medium text-rose-700 break-all">{email}</p>
                        <p className="mt-3 text-xs text-neutral-400 leading-relaxed max-w-[260px]">
                            Check your inbox and click the link to continue. It may take a minute.
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
                            className="mt-8 w-full rounded-full bg-gradient-to-r from-rose-800 to-purple-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-900/30 transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            Back to Sign In
                        </button>
                    </div>

                ) : showReset ? (

                    /* CONDITION 2: Forgot Password View */
                    <div className="space-y-5">
                        {errorMsg && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-gradient-to-r from-rose-800 to-purple-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-900/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReset(false);
                                    setErrorMsg('');
                                }}
                                className="text-xs font-semibold text-neutral-400 hover:text-rose-700 underline underline-offset-2 transition-colors outline-none"
                            >
                                ← Back to Sign In
                            </button>
                        </div>
                    </div>

                ) : (

                    /* CONDITION 3: Normal Login / Signup State Forms */
                    <div className="space-y-5">
                        {errorMsg && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                                        Password
                                    </label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowReset(true);
                                                setErrorMsg('');
                                            }}
                                            className="text-[11px] font-semibold text-rose-700 hover:underline underline-offset-2 outline-none transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-11 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-rose-700 transition-colors outline-none"
                                        tabIndex={-1}
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-gradient-to-r from-rose-800 to-purple-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-900/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing…' : isSignUp ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        {/* State switcher */}
                        <div className="pt-3 text-center text-xs text-neutral-400">
                            {isSignUp ? 'Already have an account? ' : 'New here? '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setErrorMsg('');
                                }}
                                className="font-bold text-rose-700 hover:underline underline-offset-2 outline-none transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Create an account'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}