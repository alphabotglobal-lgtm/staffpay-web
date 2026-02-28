'use client';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Clock,
    ChevronRight,
    Briefcase,
    UserCheck
} from 'lucide-react';

export default function CreatePayslipsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/payroll" className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create Payslips</h1>
                    <p className="text-gray-400 text-sm">Select staff category to proceed</p>
                </div>
            </div>

            {/* Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Permanent Staff */}
                <Link href="/payroll/create/permanent" className="group">
                    <div className="card h-64 p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition border-2 border-transparent hover:border-[var(--accent-gold)] cursor-pointer relative overflow-hidden">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--accent-gold-bg)] flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                            <Briefcase className="w-10 h-10 text-[var(--accent-gold)]" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Permanent Staff</h2>
                        <p className="text-gray-400 mb-6 max-w-xs">Generate monthly payslips for full-time contracted employees.</p>

                        <div className="flex items-center gap-2 text-[var(--accent-gold)] font-medium opacity-0 group-hover:opacity-100 transition duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <span>Continue</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>

                {/* Temporary Staff */}
                <Link href="/payroll/create/temporary" className="group">
                    <div className="card h-64 p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition border-2 border-transparent hover:border-[var(--accent-orange)] cursor-pointer relative overflow-hidden">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--accent-orange-bg)] flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                            <Clock className="w-10 h-10 text-[var(--accent-orange)]" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Temporary Staff</h2>
                        <p className="text-gray-400 mb-6 max-w-xs">Process weekly wages for seasonal and temporary workers.</p>

                        <div className="flex items-center gap-2 text-[var(--accent-orange)] font-medium opacity-0 group-hover:opacity-100 transition duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <span>Continue</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
