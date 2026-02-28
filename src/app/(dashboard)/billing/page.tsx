'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api/client';

interface BillingInfo {
    organization: {
        id: string;
        name: string;
        plan: string;
        planName: string;
        price: number;
        staffLimit: number;
        activeStaffCount: number;
        staffUsagePercent: number;
        isActive: boolean;
        isSuspended: boolean;
    };
    payments: {
        id: string;
        amount: number;
        status: string;
        plan: string;
        invoiceNumber: string;
        periodStart: string;
        periodEnd: string;
        createdAt: string;
    }[];
    availablePlans: {
        id: string;
        name: string;
        price: number;
        staffLimit: number;
        isCurrent: boolean;
    }[];
}

export default function BillingPage() {
    const [billing, setBilling] = useState<BillingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [changingPlan, setChangingPlan] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadBilling();
    }, []);

    const loadBilling = async () => {
        try {
            const data = await apiClient.get<BillingInfo>('/provisioning/billing');
            setBilling(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePlan = async (newPlan: string) => {
        setChangingPlan(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.post('/provisioning/change-plan', { plan: newPlan });
            setSuccess(`Plan changed to ${newPlan}. Changes take effect immediately.`);
            await loadBilling();
        } catch (err: any) {
            setError(err.message || 'Failed to change plan');
        } finally {
            setChangingPlan(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!billing) {
        return <div className="p-8 text-red-400">Failed to load billing info</div>;
    }

    const { organization: org, payments, availablePlans } = billing;
    const usageColor = org.staffUsagePercent >= 90 ? 'bg-red-500' : org.staffUsagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="p-8 overflow-y-auto h-full" style={{ color: 'var(--text-primary)' }}>
            <h1 className="text-2xl font-bold mb-6">Billing & Plan</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                    {success}
                </div>
            )}

            {org.isSuspended && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <h3 className="font-semibold text-red-400 mb-1">Account Suspended</h3>
                    <p className="text-sm text-red-400/70">Your payment has failed. Please update your payment method to restore access.</p>
                </div>
            )}

            {/* Current Plan */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold">{org.planName}</span>
                        <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>R{org.price.toLocaleString()}/mo</span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span style={{ color: 'var(--text-secondary)' }}>Staff Usage</span>
                                <span className="font-medium">{org.activeStaffCount} / {org.staffLimit}</span>
                            </div>
                            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-primary)' }}>
                                <div
                                    className={`h-full rounded-full transition-all ${usageColor}`}
                                    style={{ width: `${Math.min(org.staffUsagePercent, 100)}%` }}
                                />
                            </div>
                            {org.staffUsagePercent >= 80 && (
                                <p className="text-xs text-yellow-500 mt-1">
                                    Approaching staff limit. Consider upgrading.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upgrade/Downgrade */}
                <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h2 className="text-lg font-semibold mb-4">Change Plan</h2>
                    <div className="space-y-3">
                        {availablePlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${plan.isCurrent ? 'border-green-500/30 bg-green-500/5' : ''}`}
                                style={!plan.isCurrent ? { borderColor: 'var(--border-color)' } : {}}
                            >
                                <div>
                                    <span className="font-medium">{plan.name}</span>
                                    <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        R{plan.price.toLocaleString()}/mo — {plan.staffLimit} staff
                                    </span>
                                </div>
                                {plan.isCurrent ? (
                                    <span className="text-xs text-green-500 font-medium">Current</span>
                                ) : (
                                    <button
                                        onClick={() => handleChangePlan(plan.id)}
                                        disabled={changingPlan}
                                        className="px-3 py-1 text-sm rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50"
                                    >
                                        {plan.price > org.price ? 'Upgrade' : 'Downgrade'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="text-lg font-semibold">Payment History</h2>
                </div>
                {payments.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                        No payments yet
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Invoice</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    <td className="px-6 py-3 text-sm">
                                        {new Date(p.createdAt).toLocaleDateString('en-ZA')}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-mono">{p.invoiceNumber}</td>
                                    <td className="px-6 py-3 text-sm capitalize">{p.plan}</td>
                                    <td className="px-6 py-3 text-sm">R{p.amount.toLocaleString()}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                            p.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
