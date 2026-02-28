'use client';
import { useState, useEffect } from 'react';
import {
    Calendar, DollarSign, Users, Download,
    ArrowUpCircle, ArrowDownCircle, Info,
    CheckCircle2, Building2, Landmark,
    CreditCard, Save, Loader2, ChevronDown,
    CalendarDays, PieChart, ShieldCheck,
    FileText, RefreshCw, AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type ReportType = 'emp201' | 'emp501' | 'settlement';

export default function CompliancePage() {
    const [reportType, setReportType] = useState<ReportType>('emp201');
    const [isLoading, setIsLoading] = useState(false);

    // EMP201 State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [emp201Data, setEmp201Data] = useState<any>(null);

    // EMP501 State
    const [emp501Type, setEmp501Type] = useState<'interim' | 'annual'>('interim');
    const [taxYear, setTaxYear] = useState(new Date().getFullYear());
    const [emp501Data, setEmp501Data] = useState<any>(null);

    // Settlement State
    const [settlementYear, setSettlementYear] = useState(new Date().getFullYear());
    const [settlementData, setSettlementData] = useState<any>(null);

    const [accounts, setAccounts] = useState<any>({
        sars: { name: 'SARS PAYE', bank: 'Absa', account: '123456789', branch: '632005' },
        uif: { name: 'Department of Labour (UIF)', bank: 'FNB', account: '987654321', branch: '250655' }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/statutory_accounts`);
            if (res.ok) {
                const val = await res.json();
                if (val) setAccounts(val);
            }
        } catch (e) { }
    };

    const fetchEMP201 = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/statutory/emp201?month=${selectedMonth}&year=${selectedYear}`);
            if (res.ok) {
                setEmp201Data(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEMP501 = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/statutory/emp501?type=${emp501Type}&taxYear=${taxYear}`);
            if (res.ok) {
                setEmp501Data(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettlement = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/statutory/year-end-settlement?taxYear=${settlementYear}`);
            if (res.ok) {
                setSettlementData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentReportData = reportType === 'emp201' ? emp201Data : (reportType === 'emp501' ? emp501Data : null);

    const downloadCSV = () => {
        if (!currentReportData) return;
        let csv = '';
        if (reportType === 'emp201') {
            csv += `EMP201 - ${currentReportData.monthName} ${currentReportData.year}\n`;
            csv += `Employees,${currentReportData.employeeCount}\n\n`;
            csv += `Staff,Code,PAYE,UIF,SDL,ETI\n`;
            for (const s of currentReportData.staffBreakdown || []) {
                csv += `"${s.name}","${s.code}",${s.paye},${s.uifTotal},${s.sdl},${s.eti}\n`;
            }
            csv += `\nTotals,,${currentReportData.paye},${currentReportData.uif.total},${currentReportData.sdl},${currentReportData.eti}\n`;
            csv += `Net Liability,,${currentReportData.netLiability}\n`;
        } else {
            csv += `EMP501 ${emp501Type} - Tax Year ${taxYear}\n`;
            csv += `Period,${currentReportData.periodStart} to ${currentReportData.periodEnd}\n\n`;
            csv += `Month,PAYE,UIF,SDL,ETI,Net\n`;
            for (const vals of (currentReportData.monthlyBreakdown as any[])) {
                csv += `"${vals.month}",${vals.paye},${vals.uif},${vals.sdl},${vals.eti},${vals.net}\n`;
            }
            csv += `\nTotals,${currentReportData.totals.paye},${currentReportData.totals.uif},${currentReportData.totals.sdl},${currentReportData.totals.eti},${currentReportData.totals.net}\n`;
            if (currentReportData.employeeBreakdown?.length) {
                csv += `\nEmployee Breakdown\n`;
                csv += `Name,Code,Tax Number,PAYE,UIF,SDL,ETI\n`;
                for (const e of currentReportData.employeeBreakdown) {
                    csv += `"${e.name}","${e.code}","${e.taxNumber}",${e.paye},${e.uif},${e.sdl},${e.eti}\n`;
                }
            }
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportType === 'emp201'
            ? `EMP201_${currentReportData.year}_${String(selectedMonth).padStart(2, '0')}.csv`
            : `EMP501_${emp501Type}_${taxYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportSarsEfiling = () => {
        if (!currentReportData) return;
        let csv = '';
        if (reportType === 'emp201') {
            // SARS EMP201 eFiling reference format
            csv += `SARS EMP201 - Electronic Filing Reference\n`;
            csv += `Return Period,${currentReportData.period}\n`;
            csv += `Month,${currentReportData.monthName}\n`;
            csv += `Year,${currentReportData.year}\n`;
            csv += `Number of Employees,${currentReportData.employeeCount}\n\n`;
            csv += `Code,Description,Amount\n`;
            csv += `4101,PAYE - Pay As You Earn,${currentReportData.paye.toFixed(2)}\n`;
            csv += `4141,SDL - Skills Development Levy,${currentReportData.sdl.toFixed(2)}\n`;
            csv += `4102,UIF - Employer Contribution,${currentReportData.uif.employer.toFixed(2)}\n`;
            csv += `4103,UIF - Employee Contribution,${currentReportData.uif.employee.toFixed(2)}\n`;
            csv += `4118,ETI - Employment Tax Incentive,${currentReportData.eti.toFixed(2)}\n\n`;
            csv += `Total UIF (4102+4103),${currentReportData.uif.total.toFixed(2)}\n`;
            csv += `Total Liability (PAYE+SDL+UIF-ETI),${currentReportData.netLiability.toFixed(2)}\n`;
        } else {
            // SARS EMP501 reconciliation reference format
            csv += `SARS EMP501 ${emp501Type.toUpperCase()} - Reconciliation Reference\n`;
            csv += `Tax Year,${taxYear}\n`;
            csv += `Period,${currentReportData.periodStart} to ${currentReportData.periodEnd}\n`;
            csv += `Type,${emp501Type === 'interim' ? 'Interim (Mar-Aug)' : 'Annual (Mar-Feb)'}\n\n`;
            csv += `Summary Totals\n`;
            csv += `Code,Description,Amount\n`;
            csv += `4101,Total PAYE,${currentReportData.totals.paye.toFixed(2)}\n`;
            csv += `4141,Total SDL,${currentReportData.totals.sdl.toFixed(2)}\n`;
            csv += `4102/4103,Total UIF,${currentReportData.totals.uif.toFixed(2)}\n`;
            csv += `4118,Total ETI,${currentReportData.totals.eti.toFixed(2)}\n`;
            csv += `Net Due,${currentReportData.totals.net.toFixed(2)}\n\n`;
            // IRP5/IT3(a) employee certificates
            if (currentReportData.employeeBreakdown?.length) {
                csv += `Employee Tax Certificates (IRP5/IT3a)\n`;
                csv += `Name,Employee Code,Tax Reference,PAYE,SDL,UIF,ETI\n`;
                for (const e of currentReportData.employeeBreakdown) {
                    csv += `"${e.name}","${e.code}","${e.taxNumber}",${e.paye.toFixed(2)},${e.sdl.toFixed(2)},${e.uif.toFixed(2)},${e.eti.toFixed(2)}\n`;
                }
            }
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportType === 'emp201'
            ? `SARS_EMP201_${currentReportData.period}.csv`
            : `SARS_EMP501_${emp501Type}_${taxYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const printReport = () => {
        window.print();
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6 max-w-7xl mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-5 h-5 text-[var(--accent-gold)]" />
                            <h1 className="text-2xl font-bold text-white">Compliance</h1>
                        </div>
                        <p className="text-caption">Official Reporting (EMP201 Monthly, EMP501 Reconciliation & Year-End Settlement)</p>
                    </div>

                    <div className="flex p-1 glass rounded-xl">
                        <button
                            onClick={() => setReportType('emp201')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'emp201' ? 'bg-gold text-obsidian' : 'text-gray-400 hover:text-white'}`}
                        >
                            EMP201 Monthly
                        </button>
                        <button
                            onClick={() => setReportType('emp501')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'emp501' ? 'bg-gold text-obsidian' : 'text-gray-400 hover:text-white'}`}
                        >
                            EMP501 Recon
                        </button>
                        <button
                            onClick={() => setReportType('settlement')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'settlement' ? 'bg-gold text-obsidian' : 'text-gray-400 hover:text-white'}`}
                        >
                            Year-End
                        </button>
                    </div>
                </div>

                {/* Selection Controls */}
                <div className="card glass-glow p-6">
                    {reportType === 'emp201' ? (
                        <div className="flex flex-wrap items-end gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Month</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-gold)] min-w-[160px]"
                                >
                                    {months.map((m, i) => (
                                        <option key={m} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Year</span>
                                <input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-gold)] w-24"
                                />
                            </div>
                            <button
                                onClick={fetchEMP201}
                                disabled={isLoading}
                                className="bg-gold hover:brightness-110 text-obsidian px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Generate EMP201
                            </button>
                        </div>
                    ) : reportType === 'emp501' ? (
                        <div className="flex flex-wrap items-end gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reconciliation Type</span>
                                <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl">
                                    <button
                                        onClick={() => setEmp501Type('interim')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${emp501Type === 'interim' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                                    >
                                        Interim (Mar-Aug)
                                    </button>
                                    <button
                                        onClick={() => setEmp501Type('annual')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${emp501Type === 'annual' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                                    >
                                        Annual (Mar-Feb)
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tax Year Ending</span>
                                <input
                                    type="number"
                                    value={taxYear}
                                    onChange={(e) => setTaxYear(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-gold)] w-24"
                                />
                            </div>
                            <button
                                onClick={fetchEMP501}
                                disabled={isLoading}
                                className="bg-gold hover:brightness-110 text-obsidian px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Generate EMP501
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-end gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tax Year Ending</span>
                                <input
                                    type="number"
                                    value={settlementYear}
                                    onChange={(e) => setSettlementYear(parseInt(e.target.value))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-gold)] w-24"
                                />
                            </div>
                            <button
                                onClick={fetchSettlement}
                                disabled={isLoading}
                                className="bg-gold hover:brightness-110 text-obsidian px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Generate Settlement
                            </button>
                        </div>
                    )}
                </div>

                {/* Settlement View */}
                {reportType === 'settlement' && settlementData ? (
                    <>
                        {/* Settlement Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Landmark className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-tighter">PAYE Withheld</span>
                                </div>
                                <p className="text-2xl font-black text-white">R {settlementData.summary.totalPayeWithheld.toLocaleString()}</p>
                            </div>
                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">PAYE Owed</span>
                                </div>
                                <p className="text-2xl font-black text-white">R {settlementData.summary.totalPayeOwed.toLocaleString()}</p>
                            </div>
                            <div className={`card glass-glow p-5 flex flex-col gap-4 ${settlementData.summary.netDifference >= 0 ? 'bg-emerald-500/5 !border-emerald-500/20' : 'bg-red-500/5 !border-red-500/20'}`}>
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settlementData.summary.netDifference >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                        {settlementData.summary.netDifference >= 0
                                            ? <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                                            : <ArrowDownCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: settlementData.summary.netDifference >= 0 ? '#10b981' : '#ef4444' }}>
                                        {settlementData.summary.netDifference >= 0 ? 'Net Overpaid' : 'Net Underpaid'}
                                    </span>
                                </div>
                                <p className="text-2xl font-black text-white">R {Math.abs(settlementData.summary.netDifference).toLocaleString()}</p>
                            </div>
                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-purple-500/50 uppercase tracking-tighter">Employees</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold">
                                    <span className="text-emerald-400">{settlementData.summary.balanced} balanced</span>
                                    <span className="text-orange-400">{settlementData.summary.overpaid} over</span>
                                    <span className="text-red-400">{settlementData.summary.underpaid} under</span>
                                </div>
                            </div>
                        </div>

                        {/* Employee Settlement Table */}
                        <div className="card overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <h2 className="text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[var(--accent-gold)]" />
                                    Employee Settlement Details — {settlementData.period}
                                </h2>
                                <button onClick={() => {
                                    let csv = `Year-End Settlement - Tax Year ${settlementData.taxYear}\n`;
                                    csv += `Period,${settlementData.period}\n\n`;
                                    csv += `Name,Code,Tax Number,Months,Gross,Taxable,PAYE Owed,PAYE Withheld,Difference,Status,Bracket\n`;
                                    for (const e of settlementData.employees) {
                                        csv += `"${e.name}","${e.code}","${e.taxNumber}",${e.months},${e.totalGross},${e.annualTaxableIncome},${e.annualPayeOwed},${e.payeWithheld},${e.difference},${e.status},${e.bracket}\n`;
                                    }
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `Year_End_Settlement_${settlementData.taxYear}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }} className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-gold)] uppercase tracking-widest hover:brightness-125 transition">
                                    <Download className="w-3 h-3" />
                                    Download CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/5">
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Employee</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Gross</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">PAYE Owed</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">PAYE Withheld</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Difference</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {settlementData.employees.map((e: any) => (
                                            <tr key={e.staffId} className="hover:bg-white/[0.02] transition">
                                                <td className="px-4 py-3">
                                                    <span className="text-white font-black">{e.name}</span>
                                                    <p className="text-[9px] text-gray-500 font-bold">{e.code} · {e.bracket} · {e.months} months</p>
                                                </td>
                                                <td className="px-4 py-3 text-white/70 font-bold text-right">R {e.totalGross.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-white/70 font-bold text-right">R {e.annualPayeOwed.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-white/70 font-bold text-right">R {e.payeWithheld.toLocaleString()}</td>
                                                <td className={`px-4 py-3 font-black text-right ${e.difference > 0 ? 'text-emerald-400' : e.difference < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                                    {e.difference > 0 ? '+' : ''}R {e.difference.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                                        e.status === 'balanced' ? 'bg-gray-500/20 text-gray-400' :
                                                        e.status === 'overpaid' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {e.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : null}

                {/* EMP201/EMP501 Views */}
                {reportType !== 'settlement' && currentReportData ? (
                    <>
                        {/* Summary Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Landmark className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-tighter">PAYE (SARS)</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">R {(reportType === 'emp201' ? currentReportData.paye : currentReportData.totals.paye).toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest tracking-tighter">Total Tax Deducted</p>
                                </div>
                            </div>

                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">UIF (Total)</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">R {(reportType === 'emp201' ? currentReportData.uif.total : currentReportData.totals.uif).toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest tracking-tighter">Emp + Emplr Contribution</p>
                                </div>
                            </div>

                            <div className="card glass-glow p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <PieChart className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-purple-500/50 uppercase tracking-tighter">SDL</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">R {(reportType === 'emp201' ? currentReportData.sdl : currentReportData.totals.sdl).toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest tracking-tighter">Skills Development Levy</p>
                                </div>
                            </div>

                            <div className="card glass-glow p-5 flex flex-col gap-4 bg-[var(--accent-gold-bg)] !border-[var(--accent-gold)]/20">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold)]/10 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-[var(--accent-gold)]" />
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--accent-gold)]/50 uppercase tracking-tighter">Net Due</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">R {(reportType === 'emp201' ? currentReportData.netLiability : currentReportData.totals.net).toLocaleString()}</p>
                                    <div className="flex items-center gap-1.5 mt-1 border-t border-white/10 pt-1">
                                        <span className="text-[9px] text-[var(--accent-gold)] font-black uppercase tracking-widest">
                                            Credits (ETI): R {(reportType === 'emp201' ? currentReportData.eti : currentReportData.totals.eti).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 card overflow-hidden">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                    <h2 className="text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[var(--accent-gold)]" />
                                        {reportType === 'emp201' ? 'Monthly Audit Trail' : 'Reconciliation Breakdown'}
                                    </h2>
                                    <button onClick={downloadCSV} className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-gold)] uppercase tracking-widest hover:brightness-125 transition">
                                        <Download className="w-3 h-3" />
                                        Download CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">{reportType === 'emp201' ? 'Staff' : 'Month / Period'}</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-orange-400/80">PAYE</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-blue-400/80">UIF</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-purple-400/80">SDL</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">ETI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {reportType === 'emp201' ? (
                                                <tr className="hover:bg-white/[0.02] transition">
                                                    <td className="px-4 py-4">
                                                        <span className="text-white font-black">{currentReportData.monthName} {currentReportData.year} Summary</span>
                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{currentReportData.employeeCount} Staff Members</p>
                                                    </td>
                                                    <td className="px-4 py-4 font-black text-white/90">R {currentReportData.paye.toLocaleString()}</td>
                                                    <td className="px-4 py-4 font-bold text-blue-400/80">R {currentReportData.uif.total.toLocaleString()}</td>
                                                    <td className="px-4 py-4 font-bold text-purple-400/80">R {currentReportData.sdl.toLocaleString()}</td>
                                                    <td className="px-4 py-4 text-emerald-400">R {currentReportData.eti.toLocaleString()}</td>
                                                </tr>
                                            ) : (
                                                (currentReportData.monthlyBreakdown as any[]).map((vals: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-white/[0.02] transition">
                                                        <td className="px-4 py-3">
                                                            <span className="text-white font-black">{vals.month}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-white/70 font-bold">R {vals.paye.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-blue-400/70 font-bold">R {vals.uif.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-purple-400/70 font-bold">R {vals.sdl.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-emerald-400/70 font-bold">R {vals.eti.toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Column: Actions */}
                            <div className="space-y-6">
                                <div className="card glass-glow p-5 space-y-4 border-l-4 border-orange-500/50">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Compliance Tip</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {reportType === 'emp201'
                                            ? `The EMP201 for ${currentReportData.monthName} must be submitted and paid to SARS by the 7th of the following month.`
                                            : `The EMP501 ${emp501Type} reconciliation ensures your monthly 201s match your employee certificates. Ensure any discrepancies are corrected before final submission.`
                                        }
                                    </p>
                                </div>

                                <button onClick={exportSarsEfiling} className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold transition active:scale-95 flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export for SARS eFiling
                                </button>

                                <button onClick={printReport} className="w-full border border-white/10 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition active:scale-95">
                                    Print Report Summary
                                </button>
                            </div>
                        </div>
                    </>
                ) : null}

                {/* Empty State */}
                {((reportType === 'settlement' && !settlementData) || (reportType !== 'settlement' && !currentReportData)) && (
                    <div className="card glass-glow p-20 flex flex-col items-center justify-center text-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white/20" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">No Report Selected</h2>
                            <p className="text-sm text-gray-500 max-w-sm">Choose a period above and click &quot;Generate&quot; to view your statutory obligations.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
