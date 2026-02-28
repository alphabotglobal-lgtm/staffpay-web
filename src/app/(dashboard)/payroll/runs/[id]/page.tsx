'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Lock,
    Unlock,
    Download,
    Loader2,
    Users,
    CheckCircle,
    AlertTriangle,
    FileText,
    CreditCard,
    ChevronRight,
    ChevronDown,
    Edit2,
    Save,
    X,
    History
} from 'lucide-react';
import { Fragment } from 'react';
import jsPDF from 'jspdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PayRun {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: 'draft' | 'finalized';
    createdAt: string;
    finalizedAt?: string;
    payslips: Payslip[];
}

interface Payslip {
    id: string;
    staff: { firstName: string; lastName: string; employeeCode: string };
    totalHours: number;
    grossPay: number;
    deductions: number;
    netPay: number;
    snapshotRate: number;
    snapshotData?: any;
}

export default function PayrollRunPage() {
    const params = useParams();
    const router = useRouter();
    const [run, setRun] = useState<PayRun | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [expandedPayslips, setExpandedPayslips] = useState<Record<string, boolean>>({});
    const [editingDay, setEditingDay] = useState<{ payslipId: string; date: string; data: any } | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        loadRun();
    }, [params.id]);

    const loadRun = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/payroll/runs/${params.id}`);
            if (!res.ok) throw new Error('Run not found');
            const data = await res.json();
            setRun(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const isLocked = run?.status === 'finalized';

    const handleCalculate = async () => {
        if (!run || isLocked) return;
        setIsFinalizing(true); // Using same loader state for simplicity
        try {
            const res = await fetch(`${API_URL}/payroll/runs/${run.id}/calculate`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to calculate');
            await loadRun();
        } catch (e) {
            console.error(e);
            alert('Failed to refresh calculations');
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleFinalize = async () => {
        if (!run || !confirm('WARNING: This will lock all calculations. Any future changes to rates/hours will NOT affect this period. Continue?')) return;

        setIsFinalizing(true);
        try {
            const res = await fetch(`${API_URL}/payroll/runs/${run.id}/finalize`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to finalize');
            await loadRun(); // Reload to see locked state
        } catch (e) {
            alert('Failed to finalize run');
        } finally {
            setIsFinalizing(false);
        }
    };

    // Auto-calculate if draft and empty
    useEffect(() => {
        if (run && run.status === 'draft' && run.payslips.length === 0 && !isLoading) {
            handleCalculate();
        }
    }, [run?.id, run?.payslips?.length]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (!run) return <div className="text-white">Run not found</div>;

    const startDate = new Date(run.periodStart).toLocaleDateString();
    const endDate = new Date(run.periodEnd).toLocaleDateString();

    const totalPayout = run.payslips.reduce((sum, p) => sum + Number(p.netPay), 0);

    const downloadPayslipPdf = (ps: Payslip) => {
        const doc = new jsPDF();
        const snapshot = ps.snapshotData || {};
        const deductions = snapshot.deductions || {};
        const staffName = `${ps.staff.firstName} ${ps.staff.lastName}`;

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYSLIP', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${startDate} - ${endDate}`, 105, 28, { align: 'center' });
        doc.text(`Run Status: ${run!.status.toUpperCase()}`, 105, 34, { align: 'center' });

        // Staff Details
        let y = 46;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Details', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${staffName}`, 14, y);
        doc.text(`Employee Code: ${ps.staff.employeeCode}`, 110, y);
        y += 6;
        doc.text(`Hourly Rate (Snapshot): R${Number(ps.snapshotRate).toFixed(2)}`, 14, y);
        y += 12;

        // Hours Breakdown
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Hours Breakdown', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const dailyBreakdown = Array.isArray(snapshot.dailyBreakdown) ? snapshot.dailyBreakdown : [];
        const totalReg = dailyBreakdown.reduce((s: number, d: any) => s + (d.regularHours || 0), 0);
        const totalOT = dailyBreakdown.reduce((s: number, d: any) => s + (d.overtimeHours || 0), 0);
        const totalSun = dailyBreakdown.reduce((s: number, d: any) => s + (d.sundayHours || 0), 0);
        const totalHol = dailyBreakdown.reduce((s: number, d: any) => s + (d.holidayHours || 0), 0);

        const hoursRows = [
            ['Total Hours', `${Number(ps.totalHours).toFixed(2)}`],
            ['Regular Hours', `${totalReg.toFixed(2)}`],
            ['Overtime Hours', `${totalOT.toFixed(2)}`],
            ['Sunday Hours', `${totalSun.toFixed(2)}`],
            ['Public Holiday Hours', `${totalHol.toFixed(2)}`],
        ];
        hoursRows.forEach(([label, val]) => {
            doc.text(label, 14, y);
            doc.text(val, 90, y, { align: 'right' });
            y += 6;
        });
        y += 4;

        // Daily Breakdown Table
        if (dailyBreakdown.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Daily Breakdown', 14, y);
            y += 7;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Date', 14, y);
            doc.text('Regular', 60, y, { align: 'right' });
            doc.text('Overtime', 85, y, { align: 'right' });
            doc.text('Sunday', 110, y, { align: 'right' });
            doc.text('Holiday', 135, y, { align: 'right' });
            doc.text('Earnings', 170, y, { align: 'right' });
            y += 5;
            doc.setFont('helvetica', 'normal');
            [...dailyBreakdown].sort((a: any, b: any) => a.date.localeCompare(b.date)).forEach((day: any) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const dateLabel = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
                doc.text(dateLabel, 14, y);
                doc.text(`${day.regularHours}h`, 60, y, { align: 'right' });
                doc.text(`${day.overtimeHours}h`, 85, y, { align: 'right' });
                doc.text(`${day.sundayHours}h`, 110, y, { align: 'right' });
                doc.text(`${day.holidayHours}h`, 135, y, { align: 'right' });
                doc.text(`R${day.grossPay.toFixed(2)}`, 170, y, { align: 'right' });
                y += 5;
            });
            y += 4;
        }

        // Earnings
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Earnings', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Gross Pay', 14, y);
        doc.text(`R${Number(ps.grossPay).toFixed(2)}`, 90, y, { align: 'right' });
        y += 10;

        // Deductions
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Deductions', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(deductions).forEach(([name, val]: any) => {
            if (Number(val) > 0) {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(name, 14, y);
                doc.text(`R${Number(val).toFixed(2)}`, 90, y, { align: 'right' });
                y += 6;
            }
        });
        doc.setFont('helvetica', 'bold');
        doc.text('Total Deductions', 14, y);
        doc.text(`R${Number(ps.deductions).toFixed(2)}`, 90, y, { align: 'right' });
        y += 12;

        // Net Pay
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('NET PAY', 14, y);
        doc.text(`R${Number(ps.netPay).toFixed(2)}`, 90, y, { align: 'right' });
        y += 10;

        // Footer
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 196, y);
        y += 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a system-generated payslip.', 105, y, { align: 'center' });

        doc.save(`Payslip_${staffName.replace(/\s+/g, '_')}_${run!.periodStart}.pdf`);
    };

    const togglePayslip = (id: string) => {
        setExpandedPayslips(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEditClick = (payslipId: string, day: any) => {
        setEditingDay({
            payslipId,
            date: day.date,
            data: {
                regularHours: day.regularHours,
                overtimeHours: day.overtimeHours,
                sundayHours: day.sundayHours,
                holidayHours: day.holidayHours
            }
        });
    };

    const handleSaveEdit = async () => {
        if (!editingDay) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`${API_URL}/payroll/payslips/${editingDay.payslipId}/daily-breakdown`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: editingDay.date,
                    updates: editingDay.data,
                    author: 'Admin'
                })
            });

            if (!res.ok) throw new Error('Failed to save edit');

            setEditingDay(null);
            await loadRun(); // Reload to see updated totals
        } catch (e) {
            console.error(e);
            alert('Failed to save changes');
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/payroll" className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">Payroll Run</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isLocked ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'
                                }`}>
                                {run.status}
                            </span>
                        </div>
                        <p className="text-gray-400 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {startDate} - {endDate}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isLocked && (
                        <button
                            onClick={handleCalculate}
                            disabled={isFinalizing}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                        >
                            {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            Refresh Data
                        </button>
                    )}
                    {isLocked ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg cursor-not-allowed opacity-70">
                            <Lock className="w-4 h-4" />
                            Run Finalized
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalize}
                            disabled={isFinalizing || run.payslips.some(p => p.snapshotData?.error)}
                            className="flex items-center gap-2 px-4 py-2 bg-gold text-obsidian font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
                        >
                            {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Finalize & Lock
                        </button>
                    )}
                    {isLocked && (
                        <a
                            href={`${API_URL}/payroll/runs/${run.id}/export-capitec`}
                            download={`Capitec_Bulk_Payments_${run.periodStart}.csv`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition"
                        >
                            <Download className="w-4 h-4" />
                            Capitec CSV
                        </a>
                    )}
                    {isLocked && (
                        <a
                            href={`${API_URL}/payroll/runs/${run.id}/export-itreg`}
                            download={`SARS_ITREG_${run.periodStart}.csv`}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition"
                        >
                            <Download className="w-4 h-4" />
                            SARS (ITREG)
                        </a>
                    )}
                </div>
            </div>

            {/* Locked Info Banner */}
            {isLocked && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                        <p className="text-green-500 font-bold">Payroll Locked</p>
                        <p className="text-sm text-green-400/80">
                            Rates were frozen on {new Date(run.finalizedAt!).toLocaleString()}. Changes to staff profiles will not affect these numbers.
                        </p>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {run.payslips.some(p => p.snapshotData?.error) && !isLocked && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <div>
                        <p className="text-red-500 font-bold">Action Required</p>
                        <p className="text-sm text-red-400/80">
                            Some staff members have critical errors (e.g. Missing Pay Group). You cannot finalize until these are resolved.
                        </p>
                    </div>
                </div>
            )}

            {/* Public Holidays in this Period */}
            {(run as any).periodHolidays && (run as any).periodHolidays.length > 0 && (
                <div className="card p-4" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        <span className="font-medium text-amber-400 text-sm">Public Holidays in This Period</span>
                        <div className="flex flex-wrap gap-2 ml-2">
                            {(run as any).periodHolidays.map((h: any) => (
                                <span key={h.id} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                                    {new Date(h.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', weekday: 'short', timeZone: 'UTC' })} — {h.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                    <p className="text-gray-400 text-sm mb-1">Total Payout</p>
                    <p className="text-2xl font-bold text-white">R{totalPayout.toLocaleString()}</p>
                </div>
                <div className="card p-4">
                    <p className="text-gray-400 text-sm mb-1">Staff Included</p>
                    <p className="text-2xl font-bold text-white">{run.payslips.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <p className={`text-2xl font-bold ${isLocked ? 'text-green-500' : 'text-orange-500'}`}>
                        {run.status.toUpperCase()}
                    </p>
                </div>
            </div>

            {/* Payslip Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-gray-400">Staff Member</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-400">Rate (Snapshot)</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-400">Hours</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-400">Deductions</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-400">Net Pay</th>
                            <th className="text-center p-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {run.payslips.map(ps => {
                            const hasError = ps.snapshotData?.error;
                            const loanDetails = ps.snapshotData?.loanDetails;
                            const deductions = ps.snapshotData?.deductions || {};
                            const snapshot = ps.snapshotData || {};
                            const dailyBreakdown = Array.isArray(snapshot.dailyBreakdown) ? snapshot.dailyBreakdown : [];

                            return (
                                <Fragment key={ps.id}>
                                    <tr
                                        onClick={() => togglePayslip(ps.id)}
                                        className={`hover:bg-white/5 transition cursor-pointer ${hasError ? 'bg-red-500/10' : ''} ${expandedPayslips[ps.id] ? 'bg-white/5' : ''}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {expandedPayslips[ps.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {ps.staff.firstName} {ps.staff.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{ps.staff.employeeCode}</div>
                                                </div>
                                            </div>
                                            {/* Loan Balance Visibility */}
                                            {loanDetails && loanDetails.balance > 0 && (
                                                <div className="mt-1 ml-7 flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded w-fit">
                                                    <CreditCard className="w-3 h-3" />
                                                    Loan Bal: R{loanDetails.balance.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-gray-300">
                                            <div className="flex flex-col items-end gap-1">
                                                {/* Errors */}
                                                {hasError && (
                                                    <span className="text-red-400 font-bold text-xs uppercase px-2 py-1 bg-red-500/10 rounded">
                                                        {snapshot.error}
                                                    </span>
                                                )}
                                                {/* Warnings */}
                                                {ps.snapshotData?.warnings?.map((w: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {w}
                                                    </div>
                                                ))}
                                                {!hasError && !ps.snapshotData?.warnings?.length && (
                                                    `R${Number(ps.snapshotRate).toFixed(2)}/hr`
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-white">
                                            {Number(ps.totalHours)}h
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-white font-medium">R{Number(ps.deductions).toFixed(2)}</div>
                                            <div className="text-[10px] text-gray-400 flex flex-col items-end">
                                                {Object.entries(deductions).map(([name, val]: any) => {
                                                    if (Number(val) <= 0) return null;
                                                    // Simplified view: Just Show Name: RVal
                                                    return <span key={name}>{name}: R{Number(val).toFixed(2)}</span>;
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gold">
                                            {hasError ? (
                                                <span className="text-red-500">--</span>
                                            ) : (
                                                `R${Number(ps.netPay).toLocaleString()}`
                                            )}
                                        </td>
                                        <td className="p-4 flex justify-center">
                                            {isLocked ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); downloadPayslipPdf(ps); }}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Download PDF Payslip"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <div className="p-2 text-gray-600">--</div>
                                            )}
                                        </td>
                                    </tr>
                                    {/* Daily Breakdown Row */}
                                    {expandedPayslips[ps.id] && dailyBreakdown.length > 0 && (
                                        <tr className="bg-black/40 border-b border-white/5">
                                            <td colSpan={6} className="p-4">
                                                <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-white/5">
                                                            <tr className="text-gray-500 border-b border-white/10">
                                                                <th className="text-left p-2 font-medium">Date</th>
                                                                <th className="text-right p-2 font-medium">Regular</th>
                                                                <th className="text-right p-2 font-medium text-orange-400">Overtime</th>
                                                                <th className="text-right p-2 font-medium text-purple-400">Sunday</th>
                                                                <th className="text-right p-2 font-medium text-red-400">Holiday</th>
                                                                <th className="text-right p-2 font-medium text-gold">Earnings</th>
                                                                <th className="text-center p-2 font-medium text-gray-500">Edit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {[...dailyBreakdown]
                                                                .sort((a: any, b: any) => a.date.localeCompare(b.date))
                                                                .map((day: any, idx: number) => {
                                                                    const isEditing = editingDay?.payslipId === ps.id && editingDay?.date === day.date;

                                                                    return (
                                                                        <tr key={idx} className={`text-gray-300 hover:bg-white/5 transition ${isEditing ? 'bg-gold/5' : ''}`}>
                                                                            <td className="p-2 flex items-center gap-2">
                                                                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                {day.isEdited && (
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Manually Edited" />
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 text-right">
                                                                                {isEditing ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-16 bg-black/40 border border-white/20 rounded px-1 py-0.5 text-right text-white"
                                                                                        value={editingDay.data.regularHours}
                                                                                        onChange={e => setEditingDay({ ...editingDay, data: { ...editingDay.data, regularHours: Number(e.target.value) } })}
                                                                                    />
                                                                                ) : (
                                                                                    `${day.regularHours}h`
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 text-right text-orange-400">
                                                                                {isEditing ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-16 bg-black/40 border border-white/20 rounded px-1 py-0.5 text-right text-white"
                                                                                        value={editingDay.data.overtimeHours}
                                                                                        onChange={e => setEditingDay({ ...editingDay, data: { ...editingDay.data, overtimeHours: Number(e.target.value) } })}
                                                                                    />
                                                                                ) : (
                                                                                    `${day.overtimeHours}h`
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 text-right text-purple-400">
                                                                                {isEditing ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-16 bg-black/40 border border-white/20 rounded px-1 py-0.5 text-right text-white"
                                                                                        value={editingDay.data.sundayHours}
                                                                                        onChange={e => setEditingDay({ ...editingDay, data: { ...editingDay.data, sundayHours: Number(e.target.value) } })}
                                                                                    />
                                                                                ) : (
                                                                                    `${day.sundayHours}h`
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 text-right text-red-400">
                                                                                {isEditing ? (
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-16 bg-black/40 border border-white/20 rounded px-1 py-0.5 text-right text-white"
                                                                                        value={editingDay.data.holidayHours}
                                                                                        onChange={e => setEditingDay({ ...editingDay, data: { ...editingDay.data, holidayHours: Number(e.target.value) } })}
                                                                                    />
                                                                                ) : (
                                                                                    `${day.holidayHours}h`
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 text-right font-medium text-white">R{day.grossPay.toFixed(2)}</td>
                                                                            <td className="p-2 text-center">
                                                                                {!isLocked && (
                                                                                    <div className="flex items-center justify-center gap-2">
                                                                                        {isEditing ? (
                                                                                            <>
                                                                                                <button onClick={handleSaveEdit} disabled={isSavingEdit} className="text-gold hover:brightness-125 p-1">
                                                                                                    {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                                                                </button>
                                                                                                <button onClick={() => setEditingDay(null)} className="text-red-500 hover:text-red-400 p-1">
                                                                                                    <X className="w-3 h-3" />
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button onClick={() => handleEditClick(ps.id, day)} className="text-gray-500 hover:text-white p-1">
                                                                                                <Edit2 className="w-3 h-3" />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                        </tbody>
                                                        <tfoot className="bg-white/5 border-t border-white/10 font-bold text-white">
                                                            <tr>
                                                                <td className="p-2">Total Period</td>
                                                                <td className="p-2 text-right">{dailyBreakdown.reduce((s: number, d: any) => s + (d.regularHours || 0), 0).toFixed(2)}h</td>
                                                                <td className="p-2 text-right text-orange-400">{dailyBreakdown.reduce((s: number, d: any) => s + (d.overtimeHours || 0), 0).toFixed(2)}h</td>
                                                                <td className="p-2 text-right text-purple-400">{dailyBreakdown.reduce((s: number, d: any) => s + (d.sundayHours || 0), 0).toFixed(2)}h</td>
                                                                <td className="p-2 text-right text-red-400">{dailyBreakdown.reduce((s: number, d: any) => s + (d.holidayHours || 0), 0).toFixed(2)}h</td>
                                                                <td className="p-2 text-right text-gold">R{Number(ps.grossPay || 0).toFixed(2)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {run.payslips.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    {isLocked
                                        ? "No payslips generated for this period."
                                        : "Click 'Finalize' to calculate and generate payslips."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
