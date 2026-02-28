'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Bot } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
    const router = useRouter();
    const { login, loginWithEmail, isAuthenticated } = useAuth();

    const [step, setStep] = useState<'email' | 'pin'>('email');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [decodedUser, setDecodedUser] = useState<{ email: string, name: string, googleToken: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
        fetch(`${API_URL}/settings/public`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (typeof data.has_web_pin === 'boolean') setHasPin(data.has_web_pin);
                if (data.security_allowed_emails && Array.isArray(data.security_allowed_emails)) {
                    setAllowedEmails(
                        data.security_allowed_emails.map((e: string) => e.trim().toLowerCase())
                    );
                }
                setSettingsLoaded(true);
            })
            .catch(() => { setSettingsLoaded(true); });
    }, [isAuthenticated, router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await loginWithEmail(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError('Invalid access credentials');
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            const email = decoded.email;

            if (allowedEmails.length > 0 && !allowedEmails.includes(email.trim().toLowerCase())) {
                setError(`Identity "${email}" is not authorized. Secure ledger access denied.`);
                return;
            }

            setDecodedUser({
                email,
                name: decoded.name || email.split('@')[0],
                googleToken: credentialResponse.credential,
            });
            setError(null);

            if (hasPin) {
                setStep('pin');
            } else {
                setIsLoading(true);
                try {
                    await login(email, decoded.name || email.split('@')[0], credentialResponse.credential);
                    router.push('/dashboard');
                } catch (err) {
                    setError('Authentication sequence failed');
                    setIsLoading(false);
                }
            }
        } catch (e) {
            setError('Biometric/SSO payload invalid');
        }
    };
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!decodedUser) return;

        setIsLoading(true);
        try {
            const pinRes = await fetch(`${API_URL}/settings/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, type: 'web' }),
            });
            const pinResult = await pinRes.json();
            if (!pinResult.valid) {
                setError('Security PIN sequence rejected');
                setPin('');
                setIsLoading(false);
                return;
            }
            await login(decodedUser.email, decodedUser.name, decodedUser.googleToken);
            router.push('/dashboard');
        } catch (err) {
            setError('Authentication sequence failed');
            setIsLoading(false);
            setStep('email');
            setDecodedUser(null);
            setPin('');
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col md:flex-row bg-silver font-sans overflow-hidden">
            {/* Dynamic Background Element */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/10 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-200/20 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Left Panel - Branding */}
            <div className="hidden md:flex w-full md:w-1/2 p-12 lg:p-24 flex-col justify-between relative z-10 border-r border-slate-200 bg-white/40 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="login-element">
                    <div className="flex items-center gap-3 w-fit group cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 border border-gold/40 rounded-full flex items-center justify-center bg-white shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:border-gold">
                            <Bot className="w-5 h-5 text-yellow-500" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter uppercase text-slate-800">STAFFPAY AI</span>
                    </div>
                </div>

                <div className="login-element mt-auto">
                    <h1 className="text-4xl lg:text-6xl font-bold uppercase tracking-tighter text-slate-900 leading-[0.9] mb-6">
                        Access <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold to-[#b45309] font-drama italic lowercase tracking-normal pr-2">Ledger.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium tracking-wide uppercase leading-relaxed max-w-md">
                        Authenticate to manage workforce protocols and execute precision payroll logic.
                    </p>
                </div>

                <div className="login-element flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-slate-400 mt-24">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
                    <span>System Nominal</span>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-transparent min-h-[100dvh]">
                <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2rem] border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden backdrop-blur-sm">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-silver to-transparent pointer-events-none opacity-50" />

                    <div className="login-element md:hidden mb-12 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 border border-gold/40 rounded-full flex items-center justify-center bg-white shadow-sm">
                            <Bot className="w-5 h-5 text-yellow-500" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter uppercase text-slate-800">STAFFPAY AI</span>
                    </div>

                    <div className="login-element mb-10">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-900 mb-2">Auth Required</h2>
                        <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Enter root credentials</p>
                    </div>

                    {error && (
                        <div className="login-element flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6">
                            <Info className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {step === 'email' && (
                        <form onSubmit={handleEmailLogin} className="space-y-6 relative z-10">
                            <div className="login-element space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="IDENTITY.EMAIL"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-5 py-4 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white transition-all font-mono text-xs tracking-[0.1em]"
                                    autoFocus
                                    required
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="ACCESS.TOKEN"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-5 py-4 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:bg-white transition-all font-mono text-xs tracking-[0.1em]"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-element w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-slate-900 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 border border-yellow-300 bg-gold shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] text-[10px] mt-8"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                                ) : (
                                    "INITIATE PROTOCOL"
                                )}
                            </button>

                            <div className="login-element flex items-center gap-4 my-6 opacity-40">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                                <span className="text-slate-600 font-mono text-[9px] uppercase tracking-[0.3em] font-bold">OR BYPASS</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                            </div>

                            {settingsLoaded && (
                                <div className="login-element flex justify-center w-full transition-all duration-500 text-slate-900 fill-slate-900">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('SSO Handshake Failed')}
                                        theme="outline"
                                        shape="pill"
                                        size="large"
                                        width="100%"
                                        logo_alignment="center"
                                    />
                                </div>
                            )}
                        </form>
                    )}

                    {step === 'pin' && (
                        <form onSubmit={handlePinSubmit} className="w-full space-y-6 relative z-10">
                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-slate-900 bg-gold shadow-sm border border-yellow-300 text-lg">
                                    {decodedUser?.name[0]}
                                </div>
                                <div className="overflow-hidden text-left flex-1 border-l border-slate-300 pl-4">
                                    <p className="text-slate-900 font-bold truncate text-sm tracking-wide">{decodedUser?.name}</p>
                                    <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider truncate mt-1">{decodedUser?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="block text-center text-[9px] font-mono text-yellow-600 font-bold uppercase tracking-[0.3em] mb-3">
                                    Enter 6-Digit Override
                                </label>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="------"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-slate-900 text-center placeholder-slate-300 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all text-2xl tracking-[0.7em] font-mono shadow-sm"
                                    autoFocus
                                    maxLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-slate-900 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 bg-gold border border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] text-[10px] mt-4"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                                ) : (
                                    "AUTHORIZE ACCESS"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
