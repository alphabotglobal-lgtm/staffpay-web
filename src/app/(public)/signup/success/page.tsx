'use client';

import Link from 'next/link';

export default function SignupSuccessPage() {
    return (
        <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">You&apos;re All Set!</h1>
                <p className="text-white/50 mb-8 leading-relaxed">
                    Your StaffPay account has been created. Check your email for your login credentials.
                    You&apos;ll be asked to change your password on first login.
                </p>

                <Link
                    href="/login"
                    className="inline-block px-8 py-3 bg-[#C9A84C] hover:bg-[#B89A3F] text-[#0D0D12] rounded-lg font-semibold transition"
                >
                    Go to Login
                </Link>

                <p className="mt-6 text-sm text-white/30">
                    Didn&apos;t receive an email? Check your spam folder or contact support.
                </p>
            </div>
        </div>
    );
}
