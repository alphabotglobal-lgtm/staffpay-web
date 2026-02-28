'use client';
import { useState, useEffect } from 'react';
import {
    Mail,
    Plus,
    Trash2,
    Send,
    ChevronDown,
    ChevronRight,
    Clock,
    Users,
    LogIn,
    DollarSign,
    AlertTriangle,
    Loader2,
    Save,
    Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Subscription {
    id: string;
    email: string;
    frequency: string;
    includeAbsentees: boolean;
    includeLateArrivals: boolean;
    includeEarlyDepartures: boolean;
    includeOnLeave: boolean;
    includeSignInOut: boolean;
    signInOutByZone: boolean;
    includeRegularHours: boolean;
    regularHoursByZone: boolean;
    includeOvertimeHours: boolean;
    overtimeHoursByZone: boolean;
    includeStaleShifts: boolean;
    // Staff Cost
    includeStaffCost: boolean;
    staffCostBreakdownDaily: boolean;
    staffCostBreakdownWeekly: boolean;
    staffCostBreakdownMonthly: boolean;
    staffCostSplitRegularOvertime: boolean;
    staffCostListStaffDetails: boolean;

    isActive: boolean;
    lastSentAt: string | null;
}

function SubscriptionCard({
    subscription,
    onUpdate,
    onDelete,
    onSendTest
}: {
    subscription: Subscription;
    onUpdate: (id: string, data: Partial<Subscription>) => void;
    onDelete: (id: string) => void;
    onSendTest: (id: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleSendTest = async () => {
        setIsSending(true);
        await onSendTest(subscription.id);
        setIsSending(false);
    };

    return (
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg hover:bg-white/5 transition"
                    >
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(147, 51, 234, 0.15)' }}>
                        <Mail className="w-5 h-5" style={{ color: '#9333ea' }} />
                    </div>
                    <div className="flex-1">
                        <input
                            type="email"
                            value={subscription.email}
                            onChange={(e) => onUpdate(subscription.id, { email: e.target.value })}
                            placeholder="email@example.com"
                            className="bg-transparent text-white font-medium w-full focus:outline-none"
                        />
                    </div>
                    <select
                        value={subscription.frequency}
                        onChange={(e) => onUpdate(subscription.id, { frequency: e.target.value })}
                        className="px-3 py-1.5 rounded-lg text-white text-sm"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <button
                        onClick={handleSendTest}
                        disabled={isSending}
                        className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition disabled:opacity-50"
                        title="Send Test Email"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(subscription.id);
                        }}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-xs font-bold text-gray-400 mb-4 tracking-wider">REPORT OPTIONS</p>

                    {/* Attendance */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Attendance
                        </p>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeAbsentees}
                                    onChange={(e) => onUpdate(subscription.id, { includeAbsentees: e.target.checked })}
                                    className="rounded"
                                />
                                Absentees
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeLateArrivals}
                                    onChange={(e) => onUpdate(subscription.id, { includeLateArrivals: e.target.checked })}
                                    className="rounded"
                                />
                                Late Arrivals
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeEarlyDepartures}
                                    onChange={(e) => onUpdate(subscription.id, { includeEarlyDepartures: e.target.checked })}
                                    className="rounded"
                                />
                                Early Departures
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeOnLeave}
                                    onChange={(e) => onUpdate(subscription.id, { includeOnLeave: e.target.checked })}
                                    className="rounded"
                                />
                                On Leave
                            </label>
                        </div>
                    </div>

                    {/* Sign In/Out */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <LogIn className="w-4 h-4" /> Sign In/Out
                        </p>
                        <div className="flex items-center gap-4 pl-6">
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeSignInOut}
                                    onChange={(e) => onUpdate(subscription.id, { includeSignInOut: e.target.checked })}
                                    className="rounded"
                                />
                                Include Activity
                            </label>
                            {subscription.includeSignInOut && (
                                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subscription.signInOutByZone}
                                        onChange={(e) => onUpdate(subscription.id, { signInOutByZone: e.target.checked })}
                                        className="rounded"
                                    />
                                    Group by Zone
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Hours
                        </p>
                        <div className="grid grid-cols-2 gap-4 pl-6 mb-2">
                            <div>
                                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subscription.includeRegularHours}
                                        onChange={(e) => onUpdate(subscription.id, { includeRegularHours: e.target.checked })}
                                        className="rounded"
                                    />
                                    Regular Hours
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subscription.includeOvertimeHours}
                                        onChange={(e) => onUpdate(subscription.id, { includeOvertimeHours: e.target.checked })}
                                        className="rounded"
                                    />
                                    Overtime Hours
                                </label>
                            </div>
                        </div>
                        {/* Detailed Hours Options */}
                        {(subscription.includeRegularHours || subscription.includeOvertimeHours) && (
                            <div className="pl-6 ml-4 border-l border-gray-700">
                                <p className="text-xs text-gray-500 mb-2">DETAILS & BREAKDOWNS</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(subscription as any).hoursBreakdownDaily}
                                            onChange={(e) => onUpdate(subscription.id, { hoursBreakdownDaily: e.target.checked } as any)}
                                            className="rounded"
                                        />
                                        Daily Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(subscription as any).hoursBreakdownWeekly}
                                            onChange={(e) => onUpdate(subscription.id, { hoursBreakdownWeekly: e.target.checked } as any)}
                                            className="rounded"
                                        />
                                        Weekly Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(subscription as any).hoursBreakdownMonthly}
                                            onChange={(e) => onUpdate(subscription.id, { hoursBreakdownMonthly: e.target.checked } as any)}
                                            className="rounded"
                                        />
                                        Monthly Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(subscription as any).hoursListOvertimeStaff}
                                            onChange={(e) => onUpdate(subscription.id, { hoursListOvertimeStaff: e.target.checked } as any)}
                                            className="rounded"
                                        />
                                        List Staff Details
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Other */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Other
                        </p>
                        <div className="pl-6">
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeStaleShifts}
                                    onChange={(e) => onUpdate(subscription.id, { includeStaleShifts: e.target.checked })}
                                    className="rounded"
                                />
                                Stale Shifts
                            </label>
                        </div>
                    </div>

                    {/* Staff Cost */}
                    <div>
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Staff Cost
                        </p>
                        <div className="pl-6">
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    checked={subscription.includeStaffCost}
                                    onChange={(e) => onUpdate(subscription.id, { includeStaffCost: e.target.checked })}
                                    className="rounded"
                                />
                                Include Cost
                            </label>
                            {subscription.includeStaffCost && (
                                <div className="ml-4 border-l border-gray-700 pl-4 grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subscription.staffCostBreakdownDaily}
                                            onChange={(e) => onUpdate(subscription.id, { staffCostBreakdownDaily: e.target.checked })}
                                            className="rounded"
                                        />
                                        Daily Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subscription.staffCostBreakdownWeekly}
                                            onChange={(e) => onUpdate(subscription.id, { staffCostBreakdownWeekly: e.target.checked })}
                                            className="rounded"
                                        />
                                        Weekly Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subscription.staffCostBreakdownMonthly}
                                            onChange={(e) => onUpdate(subscription.id, { staffCostBreakdownMonthly: e.target.checked })}
                                            className="rounded"
                                        />
                                        Monthly Breakdown
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={subscription.staffCostSplitRegularOvertime}
                                            onChange={(e) => onUpdate(subscription.id, { staffCostSplitRegularOvertime: e.target.checked })}
                                            className="rounded"
                                        />
                                        Split Regular/OT
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={subscription.staffCostListStaffDetails}
                                            onChange={(e) => onUpdate(subscription.id, { staffCostListStaffDetails: e.target.checked })}
                                            className="rounded"
                                        />
                                        List Staff & Details
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {subscription.lastSentAt && (
                        <p className="text-xs text-gray-500 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            Last sent: {new Date(subscription.lastSentAt).toLocaleString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            const res = await fetch(`${API_URL}/reports/subscriptions`);
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
            }
        } catch (e) {
            console.error('Failed to load subscriptions', e);
        } finally {
            setIsLoading(false);
        }
    };

    const addSubscription = async () => {
        try {
            const res = await fetch(`${API_URL}/reports/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: '', frequency: 'daily' }),
            });
            if (res.ok) {
                const newSub = await res.json();
                setSubscriptions(prev => [newSub, ...prev]);
            }
        } catch (e) {
            console.error('Failed to create subscription', e);
        }
    };

    const updateSubscription = async (id: string, data: Partial<Subscription>) => {
        // Optimistic update
        setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));

        try {
            await fetch(`${API_URL}/reports/subscriptions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } catch (e) {
            console.error('Failed to update subscription', e);
        }
    };

    const deleteSubscription = async (id: string) => {
        // Store current state for rollback
        const previousSubscriptions = [...subscriptions];

        // Optimistic update - remove from UI immediately
        setSubscriptions(prev => prev.filter(s => s.id !== id));

        try {
            const res = await fetch(`${API_URL}/reports/subscriptions/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                throw new Error('Delete failed');
            }
        } catch (e) {
            console.error('Failed to delete subscription', e);
            // Rollback on error
            setSubscriptions(previousSubscriptions);
        }
    };

    const sendTestEmail = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/reports/subscriptions/${id}/send-test`, {
                method: 'POST',
            });
            const result = await res.json();
            if (result.success) {
                alert(`Test email sent to ${result.sentTo}`);
            } else {
                alert(`Failed: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Email Reports</h1>
                        <p className="text-caption">Configure automated email reports sent at 1:30 AM</p>
                    </div>
                    <button
                        onClick={addSubscription}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                        style={{ background: 'var(--accent-gold)', color: '#000' }}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Email</span>
                    </button>
                </div>

                {/* Info Card */}
                <div className="p-4 rounded-lg" style={{ background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Scheduled Reports</p>
                            <p className="text-sm text-gray-400">
                                Reports are sent automatically at <strong>1:30 AM</strong>. Daily reports go out every day,
                                weekly on Sundays, and monthly on the 1st. Connect your Google account in Settings to enable sending.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="space-y-3">
                    {subscriptions.length === 0 ? (
                        <div className="card p-12 text-center">
                            <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No Email Subscriptions</h3>
                            <p className="text-caption mb-4">Add email addresses to receive automated reports</p>
                            <button
                                onClick={addSubscription}
                                className="px-4 py-2 rounded-lg font-medium transition"
                                style={{ background: 'var(--accent-gold)', color: '#000' }}
                            >
                                Add First Email
                            </button>
                        </div>
                    ) : (
                        subscriptions.map(subscription => (
                            <SubscriptionCard
                                key={subscription.id}
                                subscription={subscription}
                                onUpdate={updateSubscription}
                                onDelete={deleteSubscription}
                                onSendTest={sendTestEmail}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
