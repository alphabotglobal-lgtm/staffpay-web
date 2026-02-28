'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    DollarSign,
    Clock,
    Users,
    Download,
    Calendar,
    TrendingUp,
    Filter,
    FileText,
    Loader2,
    Plus,
    ChevronRight,
    ChevronDown,
    Lock,
    User,
    MapPin,
    Edit2,
    Save,
    X,
    CheckCircle2
} from 'lucide-react';
import BalancesCard from '../../../components/payroll/BalancesCard';
import InterventionsCard from '../../../components/payroll/InterventionsCard';
import MandatoryDeductionsSummary from '../../../components/payroll/MandatoryDeductionsSummary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PayRun {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: 'draft' | 'finalized';
    _count: { payslips: number };
}

interface StaffPreview {
    id: string;
    firstName: string;
    lastName: string;
    facePhotoUrl?: string;
    regularHours: number;
    overtimeHours: number;
    sundayHours: number;
    holidayHours: number;
    grossPay: number;
    hourlyRate: number;
    flagged?: boolean;
    dailyBreakdown?: {
        date: string;
        regularHours: number;
        overtimeHours: number;
        sundayHours: number;
        holidayHours: number;
        grossPay: number;
    }[];
    uifEmployee?: number;
    uifEmployer?: number;
    sdlAmount?: number;
    payeAmount?: number;
}

interface ZonePreview {
    zoneId: string;
    zoneName: string;
    staff: StaffPreview[];
    totalGross: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    staffCount: number;
    hasFlagged?: boolean;
    totalPaye?: number;
    totalUif?: number;
    totalSdl?: number;
}

interface PayrollPreview {
    periodStart: string;
    periodEnd: string;
    zones: ZonePreview[];
    grandTotal: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalStaff: number;
    totalPaye?: number;
    totalUif?: number;
    totalSdl?: number;
}

export default function PayrollPage() {
    const router = useRouter();
    const [runs, setRuns] = useState<PayRun[]>([]);
    const [preview, setPreview] = useState<PayrollPreview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRunDates, setNewRunDates] = useState({ start: '', end: '' });
    const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
    const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});
    const [isRunsExpanded, setIsRunsExpanded] = useState(false);

    // Default period: current month
    const [periodStart, setPeriodStart] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    });
    const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

    // Filtered Run State
    const [runType, setRunType] = useState<'all' | 'pay_group'>('all');
    const [payGroups, setPayGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [groupStaff, setGroupStaff] = useState<any[]>([]);
    const [excludedStaffIds, setExcludedStaffIds] = useState<Set<string>>(new Set());

    // Inline Editing States
    const [editingDay, setEditingDay] = useState<{ staffId: string; date: string } | null>(null);
    const [editValues, setEditValues] = useState({ regularHours: 0, overtimeHours: 0, sundayHours: 0, holidayHours: 0 });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const searchParams = useSearchParams();
    const targetStaffId = searchParams.get('staffId');

    useEffect(() => {
        loadData();
        loadPayGroups();
    }, [periodStart, periodEnd]);

    const loadPayGroups = async () => {
        try {
            const res = await fetch(`${API_URL}/pay-groups`);
            if (res.ok) setPayGroups(await res.json());
        } catch (e) { console.error("Failed to load pay groups", e); }
    };

    // Load staff when a pay group is selected
    useEffect(() => {
        if (selectedGroupId) {
            fetch(`${API_URL}/pay-groups/${selectedGroupId}`)
                .then(res => res.json())
                .then(data => {
                    setGroupStaff(data.staff || []);
                    setExcludedStaffIds(new Set()); // Reset exclusions
                })
                .catch(e => console.error(e));
        } else {
            setGroupStaff([]);
        }
    }, [selectedGroupId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [runsRes, previewRes] = await Promise.all([
                fetch(`${API_URL}/payroll/runs`),
                fetch(`${API_URL}/payroll/preview?start=${periodStart}&end=${periodEnd}`)
            ]);
            if (runsRes.ok) setRuns(await runsRes.json());
            if (previewRes.ok) setPreview(await previewRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-expand and scroll to target staff
    useEffect(() => {
        if (targetStaffId && preview && !isLoading) {
            // Find the zone containing the staff
            const zone = preview.zones.find(z => z.staff.some(s => s.id === targetStaffId));
            if (zone) {
                setExpandedZones(prev => ({ ...prev, [zone.zoneId]: true }));
                setExpandedStaff(prev => ({ ...prev, [targetStaffId]: true }));

                // Scroll to the staff member after a short delay for DOM to update
                setTimeout(() => {
                    const el = document.getElementById(`staff-card-${targetStaffId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        }
    }, [targetStaffId, preview, isLoading]);

    const handleCreateRun = async () => {
        if (!newRunDates.start || !newRunDates.end) return;

        // Validation for Pay Group mode
        if (runType === 'pay_group' && !selectedGroupId) {
            alert('Please select a Pay Group');
            return;
        }

        try {
            const payload: any = {
                periodStart: newRunDates.start,
                periodEnd: newRunDates.end
            };

            if (runType === 'pay_group') {
                payload.payGroupId = selectedGroupId;
                if (excludedStaffIds.size > 0) {
                    payload.filterOptions = {
                        excludedStaffIds: Array.from(excludedStaffIds)
                    };
                }
            }

            const res = await fetch(`${API_URL}/payroll/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newRun = await res.json();
                router.push(`/payroll/runs/${newRun.id}`);
            }
        } catch (e) {
            alert('Failed to create run');
        }
    };

    const toggleStaffExclusion = (staffId: string) => {
        const next = new Set(excludedStaffIds);
        if (next.has(staffId)) next.delete(staffId);
        else next.add(staffId);
        setExcludedStaffIds(next);
    };

    const toggleZone = (zoneId: string) => {
        setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
    };

    const toggleStaff = (staffId: string) => {
        setExpandedStaff(prev => ({ ...prev, [staffId]: !prev[staffId] }));
    };

    const handleEditDay = (staffId: string, day: any) => {
        setEditingDay({ staffId, date: day.date });
        setEditValues({
            regularHours: day.regularHours,
            overtimeHours: day.overtimeHours,
            sundayHours: day.sundayHours,
            holidayHours: day.holidayHours
        });
    };

    const handleSaveEdit = async () => {
        if (!editingDay) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`${API_URL}/payroll/preview/daily-breakdown`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: editingDay.staffId,
                    date: editingDay.date,
                    updates: editValues,
                    author: 'Admin'
                })
            });

            if (res.ok) {
                setEditingDay(null);
                await loadData(); // Refresh everything
            } else {
                alert('Failed to save edit');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving edit');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Payroll Management</h1>
                        <p className="text-caption">Overview of hours and pay before creating payroll</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            // Reset form
                            setRunType('all');
                            setSelectedGroupId('');
                            setExcludedStaffIds(new Set());
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gold text-obsidian font-medium rounded-lg hover:opacity-90 transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Payroll Run</span>
                    </button>
                </div>

                {/* Period Selector */}
                <div className="card p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Period:</span>
                        </div>
                        <input
                            type="date"
                            value={periodStart}
                            onChange={e => setPeriodStart(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={periodEnd}
                            onChange={e => setPeriodEnd(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm"
                        />
                        {preview && (
                            <div className="ml-auto flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Regular</p>
                                    <p className="text-xl font-bold text-white">{preview.totalRegularHours}h</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Overtime</p>
                                    <p className="text-xl font-bold text-orange-400">{preview.totalOvertimeHours}h</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Grand Total</p>
                                    <p className="text-xl font-bold text-gold">{formatCurrency(preview.grandTotal)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mandatory Compliance Summary */}
                {preview && (
                    <MandatoryDeductionsSummary stats={{
                        totalPaye: preview.totalPaye || 0,
                        totalUif: preview.totalUif || 0,
                        totalSdl: preview.totalSdl || 0
                    }} />
                )}

                {/* Staff Overview by Zone */}
                <div className="card">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-medium text-white">Staff Overview by Zone</h2>
                    </div>
                    {isLoading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
                    ) : !preview || preview.zones.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No staff data for this period.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {preview.zones.map(zone => (
                                <div key={zone.zoneId}>
                                    {/* Zone Header */}
                                    <button
                                        onClick={() => toggleZone(zone.zoneId)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${zone.hasFlagged ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                                <MapPin className={`w-5 h-5 ${zone.hasFlagged ? 'text-red-400' : 'text-blue-400'}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-medium ${zone.hasFlagged ? 'text-red-400' : 'text-white'}`}>{zone.zoneName}</p>
                                                <p className="text-xs text-gray-500">{zone.staffCount} staff {zone.hasFlagged && <span className="text-red-400">⚠</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-4 text-sm mr-4">
                                                <span className="text-gray-400">Reg: <span className="text-white font-bold">{zone.totalRegularHours}h</span></span>
                                                <span className="text-gray-400">OT: <span className="text-orange-400 font-bold">{zone.totalOvertimeHours}h</span></span>
                                            </div>
                                            <p className="text-gold font-bold">{formatCurrency(zone.totalGross)}</p>
                                            {expandedZones[zone.zoneId] ? (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Staff List (Expanded) */}
                                    {expandedZones[zone.zoneId] && (
                                        <div className="bg-black/20 border-t border-white/5">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 px-4 py-2 bg-black/20 text-[9px] uppercase tracking-wider text-gray-500">
                                                <div>Reg: {zone.totalRegularHours}h</div>
                                                <div>OT: {zone.totalOvertimeHours}h</div>
                                                <div>Staff: {zone.staffCount}</div>
                                                <div className="text-blue-400">PAYE: R{(zone.totalPaye ?? 0).toFixed(2)}</div>
                                                <div className="text-blue-400">UIF: R{(zone.totalUif ?? 0).toFixed(2)}</div>
                                                <div className="text-blue-400">SDL: R{(zone.totalSdl ?? 0).toFixed(2)}</div>
                                                <div className="text-right text-gold font-bold">Gross: {formatCurrency(zone.totalGross)}</div>
                                            </div>
                                            <div className="grid grid-cols-8 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/5">
                                                <div className="col-span-2">Staff</div>
                                                <div className="text-right">Regular</div>
                                                <div className="text-right">Overtime</div>
                                                <div className="text-right">Sunday</div>
                                                <div className="text-right">Holiday</div>
                                                <div className="text-right">Total</div>
                                                <div></div>
                                            </div>
                                            {/* Staff Rows */}
                                            {zone.staff.map(member => (
                                                <div key={member.id} id={`staff-card-${member.id}`} className="border-b border-white/5 last:border-0">
                                                    <button
                                                        onClick={() => toggleStaff(member.id)}
                                                        className="w-full grid grid-cols-8 gap-2 px-4 py-3 hover:bg-white/5 transition items-center"
                                                    >
                                                        <div className="col-span-2 flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${member.flagged ? 'bg-red-500/20 ring-2 ring-red-500' : 'bg-[var(--surface-bg)]'}`}>
                                                                {member.facePhotoUrl && (member.facePhotoUrl.startsWith('http') || member.facePhotoUrl.startsWith('/uploads')) ? (
                                                                    <img
                                                                        src={member.facePhotoUrl.startsWith('http')
                                                                            ? member.facePhotoUrl
                                                                            : `${API_URL}${member.facePhotoUrl}`
                                                                        }
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                                    />
                                                                ) : (
                                                                    <User className={`w-4 h-4 ${member.flagged ? 'text-red-400' : 'text-gray-500'}`} />
                                                                )}
                                                            </div>
                                                            <span className={`text-sm text-left ${member.flagged ? 'text-red-400 font-semibold' : 'text-white'}`}>
                                                                {member.firstName} {member.lastName} {member.flagged && '⚠'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right text-sm text-gray-400">{member.regularHours}h</div>
                                                        <div className="text-right text-sm text-orange-400">{member.overtimeHours}h</div>
                                                        <div className="text-right text-sm text-purple-400">{member.sundayHours}h</div>
                                                        <div className="text-right text-sm text-red-400">{member.holidayHours}h</div>
                                                        <div className="text-right text-sm font-bold text-gold">{formatCurrency(member.grossPay)}</div>
                                                        <div className="text-right">
                                                            {expandedStaff[member.id] ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-600 inline" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Daily Breakdown */}
                                                    {expandedStaff[member.id] && member.dailyBreakdown && member.dailyBreakdown.length > 0 && (
                                                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1">
                                                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-gray-500 border-b border-white/10">
                                                                            <th className="text-left py-2 font-medium">Date</th>
                                                                            <th className="text-right py-2 font-medium">Reg</th>
                                                                            <th className="text-right py-2 font-medium">OT</th>
                                                                            <th className="text-right py-2 font-medium">Sun</th>
                                                                            <th className="text-right py-2 font-medium">Hol</th>
                                                                            <th className="text-right py-2 font-medium text-gold">Gross</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/5">
                                                                        {(member.dailyBreakdown || [])
                                                                            .sort((a, b) => a.date.localeCompare(b.date))
                                                                            .map((day, idx) => {
                                                                                const isEditing = editingDay?.staffId === member.id && editingDay?.date === day.date;
                                                                                return (
                                                                                    <tr key={idx} className={`text-gray-300 transition ${isEditing ? 'bg-white/5' : ''}`}>
                                                                                        <td className="py-2 flex items-center gap-2">
                                                                                            {(day as any).isEdited && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-sm" title="Manually Edited" />}
                                                                                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                        </td>
                                                                                        <td className="py-2 text-right">
                                                                                            {isEditing ? (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.5"
                                                                                                    value={editValues.regularHours}
                                                                                                    onChange={e => setEditValues({ ...editValues, regularHours: parseFloat(e.target.value) || 0 })}
                                                                                                    className="w-14 bg-black/40 border border-white/20 rounded px-1 text-right text-white"
                                                                                                />
                                                                                            ) : (
                                                                                                `${day.regularHours}h`
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2 text-right text-orange-400">
                                                                                            {isEditing ? (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.5"
                                                                                                    value={editValues.overtimeHours}
                                                                                                    onChange={e => setEditValues({ ...editValues, overtimeHours: parseFloat(e.target.value) || 0 })}
                                                                                                    className="w-14 bg-black/40 border border-white/20 rounded px-1 text-right text-orange-400"
                                                                                                />
                                                                                            ) : (
                                                                                                `${day.overtimeHours}h`
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2 text-right text-purple-400">
                                                                                            {isEditing ? (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.5"
                                                                                                    value={editValues.sundayHours}
                                                                                                    onChange={e => setEditValues({ ...editValues, sundayHours: parseFloat(e.target.value) || 0 })}
                                                                                                    className="w-14 bg-black/40 border border-white/20 rounded px-1 text-right text-purple-400"
                                                                                                />
                                                                                            ) : (
                                                                                                `${day.sundayHours}h`
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2 text-right text-red-400">
                                                                                            {isEditing ? (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.5"
                                                                                                    value={editValues.holidayHours}
                                                                                                    onChange={e => setEditValues({ ...editValues, holidayHours: parseFloat(e.target.value) || 0 })}
                                                                                                    className="w-14 bg-black/40 border border-white/20 rounded px-1 text-right text-red-400"
                                                                                                />
                                                                                            ) : (
                                                                                                `${day.holidayHours}h`
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2 text-right font-medium text-white">{formatCurrency(day.grossPay)}</td>
                                                                                        <td className="py-2 text-right">
                                                                                            <div className="flex justify-end gap-2">
                                                                                                {isEditing ? (
                                                                                                    <>
                                                                                                        <button
                                                                                                            onClick={handleSaveEdit}
                                                                                                            disabled={isSavingEdit}
                                                                                                            className="text-gold hover:brightness-125 p-1"
                                                                                                        >
                                                                                                            {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => setEditingDay(null)}
                                                                                                            disabled={isSavingEdit}
                                                                                                            className="text-gray-500 hover:text-white p-1"
                                                                                                        >
                                                                                                            <X className="w-3.5 h-3.5" />
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <button
                                                                                                        onClick={() => handleEditDay(member.id, day)}
                                                                                                        className="text-gray-600 hover:text-blue-400 p-1 transition-colors"
                                                                                                    >
                                                                                                        <Edit2 className="w-3 h-3" />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                    </tbody>
                                                                    <tfoot className="border-t border-white/10 font-bold text-white">
                                                                        <tr>
                                                                            <td className="pt-2">Total</td>
                                                                            <td className="pt-2 text-right">{member.regularHours}h</td>
                                                                            <td className="pt-2 text-right text-orange-400">{member.overtimeHours}h</td>
                                                                            <td className="pt-2 text-right text-purple-400">{member.sundayHours}h</td>
                                                                            <td className="pt-2 text-right text-red-400">{member.holidayHours}h</td>
                                                                            <td className="pt-2 text-right text-gold">{formatCurrency(member.grossPay)}</td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                                <div className="mt-3 flex justify-end">
                                                                    <Link
                                                                        href={`/staff/${member.id}`}
                                                                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                                                                    >
                                                                        View Profile <ChevronRight className="w-3 h-3" />
                                                                    </Link>
                                                                </div>

                                                                {/* Statutory Deductions Breakdown */}
                                                                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">PAYE</p>
                                                                        <p className="text-xs text-white">R {(member.payeAmount || 0).toFixed(2)}</p>
                                                                    </div>
                                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">UIF (Emp)</p>
                                                                        <p className="text-xs text-white">R {(member.uifEmployee || 0).toFixed(2)}</p>
                                                                    </div>
                                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">UIF (Empr)</p>
                                                                        <p className="text-xs text-white">R {(member.uifEmployer || 0).toFixed(2)}</p>
                                                                    </div>
                                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                                        <p className="text-[9px] text-gray-500 uppercase font-bold">SDL</p>
                                                                        <p className="text-xs text-white">R {(member.sdlAmount || 0).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {
                    showCreateModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                            <div className="bg-[#1e1e1e] p-6 rounded-xl w-[500px] border border-white/10 max-h-[90vh] overflow-y-auto">
                                <h3 className="text-xl font-bold text-white mb-6">New Payroll Run</h3>
                                <div className="space-y-6">

                                    {/* Run Type Filter */}
                                    <div className="bg-black/20 p-1 rounded-lg flex">
                                        <button
                                            onClick={() => setRunType('all')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${runType === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            All Staff
                                        </button>
                                        <button
                                            onClick={() => setRunType('pay_group')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${runType === 'pay_group' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            By Pay Group
                                        </button>
                                    </div>

                                    {/* Pay Group Selection */}
                                    {runType === 'pay_group' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">Select Pay Group</label>
                                                <select
                                                    value={selectedGroupId}
                                                    onChange={e => setSelectedGroupId(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                >
                                                    <option value="">-- Select Group --</option>
                                                    {payGroups.map(g => (
                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Staff Checklist */}
                                            {selectedGroupId && groupStaff.length > 0 && (
                                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                                    <div className="bg-white/5 px-3 py-2 text-xs font-semibold text-gray-400 border-b border-white/10 flex justify-between">
                                                        <span>Include Staff ({groupStaff.length - excludedStaffIds.size}/{groupStaff.length})</span>
                                                        <button
                                                            onClick={() => setExcludedStaffIds(new Set())}
                                                            className="text-gold hover:underline"
                                                        >
                                                            Select All
                                                        </button>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                                        {groupStaff.map(staff => (
                                                            <label key={staff.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!excludedStaffIds.has(staff.id)}
                                                                    onChange={() => toggleStaffExclusion(staff.id)}
                                                                    className="rounded border-gray-600 bg-black/40 text-gold focus:ring-gold"
                                                                />
                                                                <span className={`text-sm ${excludedStaffIds.has(staff.id) ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                                    {staff.firstName} {staff.lastName}
                                                                </span>
                                                                <span className="text-xs text-gray-600 ml-auto group-hover:text-gray-400 transition">
                                                                    {staff.employeeCode}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                onChange={e => setNewRunDates({ ...newRunDates, start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">End Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                onChange={e => setNewRunDates({ ...newRunDates, end: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 py-2 text-gray-400 hover:text-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateRun}
                                            className="flex-1 py-2 bg-gold text-obsidian font-bold rounded-lg hover:opacity-90 transition"
                                        >
                                            Create Run
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Previous Payroll Runs */}
                <div className="card overflow-hidden">
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                        onClick={() => setIsRunsExpanded(!isRunsExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-white font-medium">Previous Payroll Runs</h2>
                                <p className="text-caption">History of finalized and draft payroll periods</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">{runs.length} Runs</span>
                            {isRunsExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                    </div>
                    {isRunsExpanded && (
                        <div className="border-t border-white/10 bg-black/20">
                            {runs.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No payroll runs found. Create one to get started.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {runs.map(run => (
                                        <Link
                                            key={run.id}
                                            href={`/payroll/runs/${run.id}`}
                                            className="flex items-center justify-between p-4 hover:bg-white/5 transition group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${run.status === 'finalized' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    {run.status === 'finalized' ? <Lock className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                                                        {run.status} • {run._count?.payslips || 0} Payslips
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Manual Interventions Log */}
                <InterventionsCard />

                {/* Balances & Savings */}
                <BalancesCard />
            </div>
        </div>
    );
}
