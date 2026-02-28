'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Wallet, ArrowRight, Minus } from 'lucide-react';
import { apiClient } from '../../lib/api/client';

// Interfaces match the backend response
interface HistoryItem { date: string; amount: number; }
interface StaffBalance { id: string; name: string; total: number; history?: HistoryItem[]; }
interface DeductionGroup { type: string; total: number; staff: StaffBalance[]; }
interface BalancesData { savings: StaffBalance[]; deductions: DeductionGroup[]; }

export default function BalancesCard() {
    const [data, setData] = useState<BalancesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // Expanded states
    const [savingsExpanded, setSavingsExpanded] = useState(true);
    const [deductionsExpanded, setDeductionsExpanded] = useState(true);
    const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
    const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadBalances();
    }, []);

    const loadBalances = async () => {
        try {
            const result = await apiClient.get<BalancesData>('/payroll/balances');
            setData(result);
        } catch (e) {
            console.error('Failed to load balances', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !data) return null;

    const totalSavings = data.savings.reduce((sum, s) => sum + s.total, 0);
    const totalDeductions = data.deductions.reduce((sum, d) => sum + d.total, 0);
    const grandTotal = totalSavings + totalDeductions;

    const toggleType = (type: string) => {
        setExpandedTypes(p => ({ ...p, [type]: !p[type] }));
    };

    const toggleStaff = (id: string) => {
        setExpandedStaff(p => ({ ...p, [id]: !p[id] }));
    };

    return (
        <div className="card overflow-hidden transition-all duration-300">
            {/* Main Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold-bg)] flex items-center justify-center text-[var(--accent-gold)]">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Balances & Savings</h3>
                        <p className="text-caption">Accumulated Staff Savings and Deduction History</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-white">R {grandTotal.toFixed(2)}</span>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-white/10 bg-black/20">
                    {/* STAFF SAVINGS SECTION */}
                    <div className="border-b border-white/5">
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 bg-white/5"
                            onClick={() => setSavingsExpanded(!savingsExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                {savingsExpanded ? <ChevronDown className="w-4 h-4 text-gold" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                <span className="text-sm font-semibold text-gold uppercase tracking-wider">Staff Savings</span>
                            </div>
                            <span className="text-sm font-bold text-white">R {totalSavings.toFixed(2)}</span>
                        </div>

                        {savingsExpanded && (
                            <div className="p-2 space-y-1">
                                {data.savings.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-2 pl-8 hover:bg-white/5 rounded-lg group">
                                        <Link href={`/staff/${s.id}`} className="text-sm text-gray-300 hover:text-white flex items-center gap-2 transition">
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                                            {s.name}
                                        </Link>
                                        <span className="text-sm font-medium text-white">R {s.total.toFixed(2)}</span>
                                    </div>
                                ))}
                                {data.savings.length === 0 && <p className="text-xs text-gray-500 pl-8 py-2">No savings recorded.</p>}
                            </div>
                        )}
                    </div>

                    {/* DEDUCTIONS SECTION */}
                    <div>
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 bg-white/5"
                            onClick={() => setDeductionsExpanded(!deductionsExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                {deductionsExpanded ? <ChevronDown className="w-4 h-4 text-orange-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                <span className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Operational Deductions</span>
                            </div>
                            <span className="text-sm font-bold text-white">R {totalDeductions.toFixed(2)}</span>
                        </div>

                        {deductionsExpanded && (
                            <div className="p-2 space-y-2">
                                {data.deductions.map(d => (
                                    <div key={d.type} className="rounded-lg overflow-hidden border border-white/5 bg-black/20">
                                        {/* Level 1: Deduction Type */}
                                        <div
                                            className="p-2 px-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                            onClick={() => toggleType(d.type)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {expandedTypes[d.type] ? <ChevronDown className="w-3 h-3 text-gray-300" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                                                <span className="text-sm font-medium text-gray-200">{d.type}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-300">R {d.total.toFixed(2)}</span>
                                        </div>

                                        {/* Level 2: Staff */}
                                        {expandedTypes[d.type] && (
                                            <div className="border-t border-white/5 bg-black/20">
                                                {d.staff.map(s => {
                                                    const isStaffExpanded = expandedStaff[`${d.type}_${s.id}`];
                                                    return (
                                                        <div key={s.id}>
                                                            <div
                                                                className="flex items-center justify-between p-2 pl-8 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                                                                onClick={() => toggleStaff(`${d.type}_${s.id}`)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isStaffExpanded ? <Minus className="w-3 h-3 text-gold" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                                                                    <span className="text-xs text-gray-300">{s.name}</span>
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-400">R {s.total.toFixed(2)}</span>
                                                            </div>

                                                            {/* Level 3: History or Details */}
                                                            {isStaffExpanded && (s.history || (s as any).details) && (
                                                                <div className="bg-black/40 pl-12 pr-4 py-2 space-y-1 border-b border-white/5">
                                                                    {s.history?.map((h, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between text-[10px] text-gray-500">
                                                                            <span>{h.date}</span>
                                                                            <span>R {h.amount.toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                    {(s as any).details && (
                                                                        <div className="text-[10px] text-gray-500 italic">
                                                                            {(s as any).details}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {data.deductions.length === 0 && <p className="text-xs text-gray-500 pl-8 py-2">No deductions recorded.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
