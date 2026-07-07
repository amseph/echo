'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                
                if (error) {
                    if (error.status === 429 || error.status === 500 || error.message?.toLowerCase().includes('rate limit')) {
                        throw new Error('Verification email limit reached. Please check your inbox or try again in an hour.');
                    }
                    throw error;
                }

                // If signup returns a session (e.g., auto-confirm enabled), trigger the local onboarding view
                if (data?.session) {
                    router.push('/');
                    router.refresh();
                } else {
                    // Instead of redirecting, freeze the UI and show the custom message
                    setShowEmailCheck(true);
                }
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
            <div className="relative flex flex-col items-center justify-end bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-950 px-6 pt-28 pb-16 text-center">
                {/* Logo */}
                <img
                    src="/icon-512.png"
                    className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-lg"
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
            <div className="relative z-10 -mt-6 flex-1 rounded-t-[2.5rem] bg-white px-6 pt-8 pb-10 shadow-2xl overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* CONDITION 1: Email check / confirmation screen */}
                    {showEmailCheck ? (
                        <motion.div
                            key="emailCheck"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex flex-col items-center text-center py-6"
                        >
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Verify your email</h2>
                        <p className="mt-1 text-sm text-neutral-500 leading-relaxed max-w-[280px]">
                            We sent a verification link to your email address. Please check your inbox and spam folder to activate your ECHO account.
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
                            className="mt-8 w-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            Back to Sign In
                        </button>
                        </motion.div>

                    ) : showReset ? (

                        /* CONDITION 2: Forgot Password View */
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="space-y-5"
                        >
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
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="text-xs font-semibold text-neutral-400 hover:text-emerald-700 underline underline-offset-2 transition-colors outline-none"
                            >
                                ← Back to Sign In
                            </button>
                        </div>
                        </motion.div>

                    ) : (

                        /* CONDITION 3: Normal Login / Signup State Forms */
                        <motion.div
                            key={isSignUp ? 'signup' : 'login'}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="space-y-5"
                        >
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
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
                                            className="text-[11px] font-semibold text-emerald-700 hover:underline underline-offset-2 outline-none transition-colors"
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
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-11 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-emerald-700 transition-colors outline-none"
                                        tabIndex={-1}
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="font-bold text-emerald-700 hover:underline underline-offset-2 outline-none transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Create an account'}
                            </button>
                        </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}