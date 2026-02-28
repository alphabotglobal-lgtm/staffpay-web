'use client';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const PLAN_NAMES: Record<string, string> = {
    core: 'Core — R1,900/mo (30 staff)',
    scale: 'Scale — R2,500/mo (50 staff)',
    enterprise: 'Enterprise — R4,500/mo (100 staff)',
};

export default function SignupModal({ plan, onClose }: { plan: string; onClose: () => void }) {
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(plan);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const formRef = useRef<HTMLFormElement>(null);
    const [payFastData, setPayFastData] = useState<Record<string, string> | null>(null);
    const [payFastUrl, setPayFastUrl] = useState('');

    // Auto-submit hidden form to PayFast
    useEffect(() => {
        if (payFastData && formRef.current) {
            formRef.current.submit();
        }
    }, [payFastData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreedToTerms) {
            setError('Please agree to the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/provisioning/initiate-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    adminName,
                    adminEmail,
                    plan: selectedPlan,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            // Set PayFast form data — the useEffect will auto-submit
            setPayFastUrl(data.payFastUrl);
            setPayFastData(data.payFastFormData);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-charcoal border border-gold/20 rounded-[2rem] w-full max-w-md p-8 relative shadow-[0_0_60px_rgba(250,204,21,0.1)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-ivory mb-1 uppercase tracking-tighter">Get Started</h2>
                <p className="text-chrome text-sm mb-6 uppercase tracking-wider font-medium">Set up your StaffPay account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50"
                            placeholder="Your Company Ltd"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">Your Full Name</label>
                        <input
                            type="text"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50"
                            placeholder="John Smith"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/50"
                            placeholder="john@company.co.za"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">Plan</label>
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold/50"
                        >
                            {Object.entries(PLAN_NAMES).map(([key, label]) => (
                                <option key={key} value={key} className="bg-[#1A1A24]">{label}</option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer py-2">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#C9A84C]"
                        />
                        <span className="text-sm text-white/40">
                            I agree to the terms of service and privacy policy. I understand my account will be activated after payment.
                        </span>
                    </label>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gold hover:scale-[1.02] text-obsidian rounded-full font-black uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                    >
                        {loading ? 'Processing...' : 'Proceed to Payment'}
                    </button>

                    <p className="text-center text-xs text-white/20">
                        Secure payment via PayFast
                    </p>
                </form>

                {/* Hidden PayFast redirect form */}
                {payFastData && (
                    <form ref={formRef} method="POST" action={payFastUrl} className="hidden">
                        {Object.entries(payFastData).map(([key, value]) => (
                            <input key={key} type="hidden" name={key} value={value} />
                        ))}
                    </form>
                )}
            </div>
        </div>
    );
}
