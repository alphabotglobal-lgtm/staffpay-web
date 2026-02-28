'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    DollarSign,
    Building,
    Coins,
    ChevronDown,
    ChevronRight,
    Clock,
    Calendar,
    Save,
    Camera,
    Loader2,
    AlertTriangle,
    Trash2,
    CreditCard,
    PiggyBank,
    Receipt,
    Palmtree,
    FileText,
    Heart,
    Minus,
    Download
} from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Staff {
    id: string;
    employeeCode?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    zoneId?: string;
    zone?: { id: string; name: string };
    payGroupId?: string;
    payGroup?: {
        id: string;
        name: string;
        hourlyRate?: number;
        overtimeRate?: number;
        sundayRate?: number;
        publicHolidayRate?: number;
    };
    role?: string;
    hourlyRate?: number;
    overtimeRate?: number;
    sundayRate?: number;
    publicHolidayRate?: number;
    hoursPerDay?: number;
    lunchLength?: number;
    startDate?: string;
    bankName?: string;
    bankAccount?: string;
    bankBranch?: string;
    status?: string;
    facePhotoUrl?: string;
    // Financials
    loanTotal?: number;
    loanMonthly?: number;
    loanBalance?: number;
    savingsTotal?: number;
    savingsMonthly?: number;
    staffDeductions?: any[];
    payeEnabled?: boolean;
    uifEnabled?: boolean;
    sdlEnabled?: boolean;
    // Statutory
    idNumber?: string;
    taxNumber?: string;
    passportNumber?: string;
    passportCountry?: string;
    passportIssueDate?: string;
    // Balances
    annualLeaveBalance?: number;
    sickLeaveBalance?: number;
}

interface Zone {
    id: string;
    name: string;
}

// Reusable Expandable Section Component
function ExpandableSection({ title, icon: Icon, iconColor, children, defaultExpanded = false }: any) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (
        <div className="card overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-15" style={{ backgroundColor: iconColor }}></div>
                        <Icon className="w-5 h-5 relative z-10" style={{ color: iconColor }} />
                    </div>
                    <span className="font-semibold text-white text-lg">{title}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5">
                    <div className="pt-4 space-y-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

// Input Field Component
function InputField({ label, value, onChange, type = "text", icon: Icon, suffix, disabled = false, placeholder = "" }: any) {
    return (
        <div className="space-y-1">
            {label && <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</label>}
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
                <input
                    type={type}
                    value={value || ''}
                    onChange={e => onChange && onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-9' : 'px-3'} py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-gold)] transition disabled:opacity-50 placeholder-gray-600`}
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
            </div>
        </div>
    );
}

// Nested Expandable (for sub-sections like Hourly Rates, Loans, etc.)
function NestedExpandable({ title, icon: Icon, iconColor, children }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="rounded-lg border border-white/10 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    <span className="font-medium text-white text-sm">{title}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="p-3 pt-0 border-t border-white/5 bg-white/2">
                    <div className="pt-3 space-y-3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

// Payslip History Section
function PayslipSection({ staffId }: { staffId: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadPayslips = async () => {
        if (payslips.length > 0) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get<any[]>(`/payroll/staff/${staffId}`);
            setPayslips(data || []);
        } catch (e) {
            console.error('Failed to load payslips:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpand = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) loadPayslips();
    };

    const downloadPdf = (ps: any) => {
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();
        const snapshot = ps.snapshotData || {};
        const deductions = snapshot.deductions || {};
        const staffName = ps.staff ? `${ps.staff.firstName} ${ps.staff.lastName}` : (snapshot.staffName || 'Staff');
        const periodStart = ps.run?.periodStart ? new Date(ps.run.periodStart).toLocaleDateString() : '';
        const periodEnd = ps.run?.periodEnd ? new Date(ps.run.periodEnd).toLocaleDateString() : '';

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYSLIP', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${periodStart} - ${periodEnd}`, 105, 28, { align: 'center' });

        // Staff Details
        let y = 40;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Details', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${staffName}`, 14, y);
        doc.text(`Employee Code: ${ps.staff?.employeeCode || ''}`, 110, y);
        y += 6;
        doc.text(`Rate: R${Number(ps.snapshotRate || 0).toFixed(2)}/hr`, 14, y);
        y += 12;

        // Hours Breakdown
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Hours', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const hours = [
            ['Total Hours', `${Number(ps.totalHours || 0).toFixed(2)}`],
            ['Regular Hours', `${Number(ps.regularHours || snapshot.regularHours || 0).toFixed(2)}`],
            ['Overtime Hours', `${Number(ps.overtimeHours || snapshot.overtimeHours || 0).toFixed(2)}`],
            ['Sunday Hours', `${Number(ps.sundayHours || snapshot.sundayHours || 0).toFixed(2)}`],
            ['Public Holiday Hours', `${Number(ps.publicHolidayHours || snapshot.publicHolidayHours || 0).toFixed(2)}`],
        ];
        hours.forEach(([label, val]) => {
            doc.text(label, 14, y);
            doc.text(val, 90, y, { align: 'right' });
            y += 6;
        });
        y += 6;

        // Earnings
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Earnings', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Gross Pay', 14, y);
        doc.text(`R${Number(ps.grossPay || 0).toFixed(2)}`, 90, y, { align: 'right' });
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
                doc.text(name, 14, y);
                doc.text(`R${Number(val).toFixed(2)}`, 90, y, { align: 'right' });
                y += 6;
            }
        });
        doc.setFont('helvetica', 'bold');
        doc.text('Total Deductions', 14, y);
        doc.text(`R${Number(ps.deductions || 0).toFixed(2)}`, 90, y, { align: 'right' });
        y += 12;

        // Net Pay
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('NET PAY', 14, y);
        doc.text(`R${Number(ps.netPay || 0).toFixed(2)}`, 90, y, { align: 'right' });
        y += 10;

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 196, y);
        y += 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a system-generated payslip.', 105, y, { align: 'center' });

        doc.save(`Payslip_${staffName.replace(/\s+/g, '_')}_${periodStart}.pdf`);
    };

    return (
        <div className="card overflow-hidden transition-all duration-300">
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-15" style={{ backgroundColor: '#a855f7' }}></div>
                        <Receipt className="w-5 h-5 relative z-10" style={{ color: '#a855f7' }} />
                    </div>
                    <div>
                        <span className="font-semibold text-white text-lg block text-left">Payslips</span>
                        <span className="text-xs text-gray-400 block text-left">Download & History</span>
                    </div>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5">
                    <div className="pt-4">
                        {isLoading ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-500 mx-auto" />
                            </div>
                        ) : payslips.length === 0 ? (
                            <p className="text-gray-500 text-sm italic py-4 text-center">No payslips found. Payslips will appear here after payroll runs are finalized.</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {payslips.map((ps, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
                                                <FileText className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">
                                                    {ps.run?.periodStart ? new Date(ps.run.periodStart).toLocaleDateString() : ''} - {ps.run?.periodEnd ? new Date(ps.run.periodEnd).toLocaleDateString() : ''}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {Number(ps.totalHours || 0).toFixed(1)}h worked
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-green-400 text-sm font-bold">R{Number(ps.netPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                <div className="text-[10px] text-gray-500">Net Pay</div>
                                            </div>
                                            <button
                                                onClick={() => downloadPdf(ps)}
                                                className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition"
                                                title="Download PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Read-Only Leave Section with History
function LeaveSection({ formData, leaveHistory, loadingHistory }: { formData: any; leaveHistory: any[]; loadingHistory: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const leaveTypes = [
        { key: 'annual', label: 'Annual Leave', balanceField: 'annualLeaveBalance', color: '#06b6d4' },
        { key: 'sick', label: 'Sick Leave', balanceField: 'sickLeaveBalance', color: '#f59e0b' },
    ];

    return (
        <div className="card overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-15" style={{ backgroundColor: '#06b6d4' }}></div>
                        <Palmtree className="w-5 h-5 relative z-10" style={{ color: '#06b6d4' }} />
                    </div>
                    <div>
                        <span className="font-semibold text-white text-lg block text-left">Leave</span>
                        <span className="text-xs text-gray-400 block text-left">Balances & History</span>
                    </div>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5">
                    {/* Balances */}
                    <div className="pt-4 grid grid-cols-2 gap-4">
                        {leaveTypes.map(lt => (
                            <div key={lt.key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt.color }}></div>
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">{lt.label}</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formData[lt.balanceField] || 0} <span className="text-sm font-normal text-gray-500">days</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Available Balance</div>
                            </div>
                        ))}
                    </div>

                    {/* History */}
                    <div className="mt-6">
                        <h4 className="text-sm font-semibold text-white mb-3">Leave History</h4>
                        {loadingHistory ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-500 mx-auto" />
                            </div>
                        ) : leaveHistory.length === 0 ? (
                            <p className="text-gray-500 text-sm italic py-2">No leave history found.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {leaveHistory.map((leave, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5`}>
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium capitalize">{leave.type.replace('_', ' ')} Leave</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(leave.startDate).toLocaleDateString()}
                                                    {leave.startDate !== leave.endDate && ` - ${new Date(leave.endDate).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white text-sm font-medium">{parseFloat(String(leave.days ?? 0)) || 0} days</div>
                                            <div className={`text-xs capitalize ${leave.status === 'approved' ? 'text-green-400' :
                                                leave.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                                                }`}>
                                                {leave.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Deductions Section - Modular deductions with %/R toggle (matches mobile)
function DeductionsSection({ formData, updateField }: { formData: any; updateField: (key: string, value: any) => void }) {
    const standardDeductions = [
        { num: 1, nameField: 'deduction1Name', valueField: 'deduction1Value', percentField: 'deduction1IsPercent', defaultName: '' },
        { num: 2, nameField: 'deduction2Name', valueField: 'deduction2Value', percentField: 'deduction2IsPercent', defaultName: '' },
        { num: 3, nameField: 'deduction3Name', valueField: 'deduction3Value', percentField: 'deduction3IsPercent', defaultName: '' },
    ];

    // Helper to calculate theoretical tax bracket (frontend mirror)
    const calculateBracket = (hourlyRate: number) => {
        const standardHours = 160;
        const monthly = hourlyRate * standardHours;
        const annual = monthly * 12;

        if (annual <= 237100) return '18%';
        if (annual <= 370500) return '26%';
        if (annual <= 512800) return '31%';
        if (annual <= 673000) return '36%';
        if (annual <= 857900) return '39%';
        if (annual <= 1817000) return '41%';
        return '45%';
    };

    const bracket = calculateBracket(formData.hourlyRate || 0);

    const statutory = [
        { key: 'payeEnabled', label: 'PAYE (Income Tax)', description: `Auto-calculated @ ~${bracket} bracket`, value: formData.payeEnabled },
        { key: 'uifEnabled', label: 'UIF (Fixed 1%)', description: 'Employee contribution (capped)', value: formData.uifEnabled },
        { key: 'sdlEnabled', label: 'SDL (Employer 1%)', description: 'Skills Development Levy', value: formData.sdlEnabled },
    ];

    const PercentToggle = ({ isPercent, onToggle }: { isPercent: boolean; onToggle: () => void }) => (
        <button
            onClick={onToggle}
            className={`px-2 py-1 rounded text-xs font-bold border ${isPercent
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-green-500/20 border-green-500 text-green-400'
                }`}
        >
            {isPercent ? '%' : 'R'}
        </button>
    );

    const Checkbox = ({ checked, onChange, label, description }: any) => (
        <label className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer group">
            <div className="pt-0.5">
                <input
                    type="checkbox"
                    checked={checked !== false}
                    onChange={e => onChange(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[var(--accent-gold)] focus:ring-[var(--accent-gold)] transition cursor-pointer"
                />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-white group-hover:text-gold transition">{label}</p>
                {description && <p className="text-[10px] text-gray-500 uppercase tracking-tight font-medium">{description}</p>}
            </div>
        </label>
    );

    return (
        <NestedExpandable title="Deductions" icon={Minus} iconColor="#ef4444">
            <div className="space-y-4">
                {/* Statutory Deductions */}
                <div className="space-y-2">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-white/10"></div>
                        Statutory Deductions (SA)
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {statutory.map(s => (
                            <Checkbox
                                key={s.key}
                                label={s.label}
                                description={s.description}
                                checked={s.value}
                                onChange={(val: boolean) => updateField(s.key, val)}
                            />
                        ))}
                    </div>
                </div>

                {/* Standard Configurable Slots */}
                <div className="pt-4 border-t border-white/10">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-white/10"></div>
                        Standard Slots
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>
                    <div className="space-y-2">
                        {standardDeductions.map(d => (
                            <div key={d.num} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={formData[d.nameField] || d.defaultName}
                                    onChange={e => updateField(d.nameField, e.target.value)}
                                    className="flex-[2] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                                    placeholder="Enter name"
                                />
                                <input
                                    type="number"
                                    value={formData[d.valueField] || 0}
                                    onChange={e => updateField(d.valueField, Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right font-mono"
                                    min="0"
                                    step="0.01"
                                />
                                <PercentToggle
                                    isPercent={formData[d.percentField] ?? true}
                                    onToggle={() => updateField(d.percentField, !(formData[d.percentField] ?? true))}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pension-style (Deduction 4) */}
                <div className="pt-4 border-t border-white/10">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-white/10"></div>
                        Pensions & Funds
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={formData.deduction4Name || 'Pension'}
                            onChange={e => updateField('deduction4Name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                            placeholder="Fund Name (e.g. Pension)"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Employee</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.deduction4EmployeeValue || 0}
                                        onChange={e => updateField('deduction4EmployeeValue', Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right font-mono"
                                        min="0"
                                        step="0.01"
                                    />
                                    <PercentToggle
                                        isPercent={formData.deduction4EmployeeIsPercent ?? true}
                                        onToggle={() => updateField('deduction4EmployeeIsPercent', !(formData.deduction4EmployeeIsPercent ?? true))}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mb-1">Employer</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.deduction4EmployerValue || 0}
                                        onChange={e => updateField('deduction4EmployerValue', Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right font-mono"
                                        min="0"
                                        step="0.01"
                                    />
                                    <PercentToggle
                                        isPercent={formData.deduction4EmployerIsPercent ?? true}
                                        onToggle={() => updateField('deduction4EmployerIsPercent', !(formData.deduction4EmployerIsPercent ?? true))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </NestedExpandable>
    );
}


// Weekly Activity Section - fetches and displays staff activity
function WeeklyActivitySection({ staffId }: { staffId: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadActivity = async () => {
        if (activity.length > 0) return; // Already loaded
        setIsLoading(true);
        try {
            const data = await apiClient.get<any[]>(`/sign-ins/staff/${staffId}?limit=20`);
            setActivity(data || []);
        } catch (e) {
            console.error('Failed to load activity:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpand = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) loadActivity();
    };

    return (
        <div className="card overflow-hidden transition-all duration-300">
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-15" style={{ backgroundColor: '#f59e0b' }}></div>
                        <Calendar className="w-5 h-5 relative z-10" style={{ color: '#f59e0b' }} />
                    </div>
                    <span className="font-semibold text-white text-lg">This Week&apos;s Activity</span>
                </div>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5">
                    <div className="pt-4 space-y-2">
                        {isLoading ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                            </div>
                        ) : activity.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                                <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No activity recorded</p>
                            </div>
                        ) : (
                            activity.map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${event.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-white text-sm font-medium capitalize">{event.type === 'in' ? 'Signed In' : 'Signed Out'}</span>
                                        <span className="text-gray-400 text-xs">{event.zone?.name || ''}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">
                                        {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StaffProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [staff, setStaff] = useState<Staff | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [payGroups, setPayGroups] = useState<any[]>([]);

    // Leave History State
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [loadingLeave, setLoadingLeave] = useState(false);

    useEffect(() => {
        loadStaff();
        loadZones();
        loadPayGroups();
        loadLeaveHistory();
    }, [params.id]);

    const loadStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<Staff>(`/staff/${params.id}?t=${Date.now()}`);
            setStaff(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phone: data.phone || '',
                email: data.email || '',
                role: data.role || 'staff',
                zoneId: data.zoneId || data.zone?.id || '',
                payGroupId: data.payGroupId || data.payGroup?.id || '',
                hourlyRate: data.hourlyRate || 0,
                overtimeRate: data.overtimeRate || 1.5,
                sundayRate: data.sundayRate || 2.0,
                publicHolidayRate: data.publicHolidayRate || 2.0,
                hoursPerDay: data.hoursPerDay || 8,
                lunchLength: data.lunchLength || 30,
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || '',
                bankBranch: data.bankBranch || '',
                // Leave Balances (Load from API data directly)
                annualLeaveBalance: Number(data.annualLeaveBalance) || 0,
                sickLeaveBalance: Number(data.sickLeaveBalance) || 0,
                // Loan/Savings defaults
                loanTotal: Number(data.loanTotal) || 0,
                loanMonthly: Number(data.loanMonthly) || 0,
                loanBalance: Number(data.loanBalance) || 0,
                savingsTotal: Number(data.savingsTotal) || 0,
                savingsMonthly: Number(data.savingsMonthly) || 0,
                facePhotoUrl: data.facePhotoUrl,
                deductions: data.staffDeductions ? data.staffDeductions.map((d: any) => ({ name: d.name, amount: Number(d.amount) })) : [],
                payeEnabled: data.payeEnabled !== false,
                uifEnabled: data.uifEnabled !== false,
                sdlEnabled: data.sdlEnabled !== false,
                idNumber: data.idNumber || '',
                taxNumber: data.taxNumber || '',
                passportNumber: data.passportNumber || '',
                passportCountry: data.passportCountry || '',
            });
        } catch (e) {
            setError('Staff not found');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadZones = async () => {
        try {
            const data = await apiClient.get<Zone[]>('/zones');
            setZones(data);
        } catch (e) {
            console.error('Failed to load zones:', e);
        }
    };

    const loadPayGroups = async () => {
        try {
            const data = await apiClient.get<any[]>('/pay-groups');
            setPayGroups(data || []);
        } catch (e) {
            console.error('Failed to load pay groups:', e);
        }
    };

    const loadLeaveHistory = async () => {
        setLoadingLeave(true);
        try {
            const data = await apiClient.get<any[]>(`/leave/staff/${params.id}`);
            setLeaveHistory(data || []);
        } catch (e) {
            console.error('Failed to load leave history:', e);
        } finally {
            setLoadingLeave(false);
        }
    };

    const updateRatesFromGroup = (groupId: string) => {
        const group = payGroups.find(g => g.id === groupId);
        if (group) {
            setFormData((prev: any) => ({
                ...prev,
                payGroupId: groupId,
                // Clear individual overrides so group rates take precedence
                hourlyRate: null,
                overtimeRate: null,
                sundayRate: null,
                publicHolidayRate: null,
                hoursPerDay: null
            }));
        } else {
            // Clear pay group if empty string passed
            setFormData((prev: any) => ({ ...prev, payGroupId: '' }));
        }
    };

    const updateField = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!staff) return;
        setIsSaving(true);
        try {
            const updated = await apiClient.put<Staff>(`/staff/${staff.id}`, formData);
            setStaff(updated);
            alert('Staff updated successfully');
        } catch (e) {
            console.error(e);
            alert('Failed to save staff');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!staff || !confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await apiClient.delete(`/staff/${staff.id}`);
            router.push('/staff');
        } catch (e) {
            console.error(e);
            alert('Failed to delete staff');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !staff) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <Link href="/staff" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Staff</span>
                </Link>
                <div className="card p-12 text-center">
                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Staff Not Found</h2>
                    <p className="text-caption">The staff member you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6 max-w-2xl mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Staff Profile</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-2 rounded-lg bg-gold text-obsidian font-medium hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="relative w-28 h-28 mb-4">
                        <div className="w-full h-full rounded-full bg-gray-800 border-4 border-gold flex items-center justify-center overflow-hidden">
                            {formData.facePhotoUrl && (formData.facePhotoUrl.startsWith('http') || formData.facePhotoUrl.startsWith('/uploads')) ? (
                                <img
                                    src={formData.facePhotoUrl.startsWith('http')
                                        ? formData.facePhotoUrl
                                        : `${API_URL}${formData.facePhotoUrl}`
                                    }
                                    alt={`${formData.firstName} ${formData.lastName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : null}
                            <span className={`text-3xl font-bold text-gray-400 ${formData.facePhotoUrl ? 'hidden' : ''}`}>
                                {formData.firstName?.[0]}{formData.lastName?.[0]}
                            </span>
                        </div>
                    </div>

                    <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-4">
                        <InputField
                            label="First Name"
                            value={formData.firstName}
                            onChange={(v: string) => updateField('firstName', v)}
                        />
                        <InputField
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(v: string) => updateField('lastName', v)}
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-[var(--accent-green-bg)] text-[var(--accent-green)] text-xs font-bold uppercase tracking-wider">
                            {staff?.status || 'ACTIVE'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">{staff?.employeeCode || `EMP-${staff?.id.slice(0, 6).toUpperCase()}`}</span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-white/10">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase mb-1">Zone</p>
                            <p className="text-sm font-medium text-white">{staff?.zone?.name || 'Unassigned'}</p>
                        </div>
                        <div className="text-center border-l border-r border-white/10">
                            <p className="text-xs text-gray-400 uppercase mb-1">Role</p>
                            <p className="text-sm font-medium text-white capitalize">{staff?.role || 'Staff'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase mb-1">Rate</p>
                            <p className="text-sm font-medium text-green-400">R{formData.payGroupId ? (payGroups.find(g => g.id === formData.payGroupId)?.hourlyRate || staff?.hourlyRate || 0) : (staff?.hourlyRate || 0)}/hr</p>
                        </div>
                    </div>
                </div>

                {/* Member Info / Contact */}
                <ExpandableSection title="Member Info" icon={User} iconColor="#3b82f6">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Phone" value={formData.phone} onChange={(v: string) => updateField('phone', v)} icon={Phone} />
                        <InputField label="Email" value={formData.email} onChange={(v: string) => updateField('email', v)} icon={Mail} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="ID Number" value={formData.idNumber} onChange={(v: string) => updateField('idNumber', v)} icon={FileText} />
                        <InputField label="Tax Number" value={formData.taxNumber} onChange={(v: string) => updateField('taxNumber', v)} icon={Receipt} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Passport Number" value={formData.passportNumber} onChange={(v: string) => updateField('passportNumber', v)} icon={FileText} />
                        <InputField label="Country of Issue" value={formData.passportCountry} onChange={(v: string) => updateField('passportCountry', v)} icon={MapPin} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Next of Kin" value={formData.nextOfKin} onChange={(v: string) => updateField('nextOfKin', v)} icon={Heart} />
                        <InputField label="Alt Phone" value={formData.altPhone} onChange={(v: string) => updateField('altPhone', v)} icon={Phone} />
                    </div>
                </ExpandableSection >

                {/* Current Assignment */}
                < ExpandableSection title="Current Assignment" icon={MapPin} iconColor="#a855f7" >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Assigned Zone</label>
                            <select
                                value={formData.zoneId}
                                onChange={(e) => updateField('zoneId', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white focus:outline-none focus:border-[var(--accent-gold)] transition appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                            >
                                <option value="" className="bg-[#1a1a2e] text-white">-- No Zone Assigned --</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id} className="bg-[#1a1a2e] text-white">{zone.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => updateField('role', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white focus:outline-none focus:border-[var(--accent-gold)] transition appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                            >
                                <option value="staff" className="bg-[#1a1a2e] text-white">Staff</option>
                                <option value="manager" className="bg-[#1a1a2e] text-white">Manager</option>
                                <option value="admin" className="bg-[#1a1a2e] text-white">Admin</option>
                            </select>
                        </div>
                    </div>
                </ExpandableSection >

                {/* This Week's Activity */}
                < WeeklyActivitySection staffId={params.id} />

                {/* Finances */}
                < ExpandableSection title="Finances" icon={DollarSign} iconColor="var(--accent-gold)" >
                    {/* Hourly Rates */}
                    < NestedExpandable title="Pay Group & Rates" icon={Coins} iconColor="var(--accent-gold)" >
                        <div className="mb-4">
                            <label className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Pay Group</label>
                            <select
                                value={formData.payGroupId || ''}
                                onChange={(e) => updateRatesFromGroup(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white focus:outline-none focus:border-[var(--accent-gold)] transition appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                            >
                                <option value="" className="bg-[#1a1a2e] text-white">-- No Pay Group (Manual Rates) --</option>
                                {payGroups.map((group) => (
                                    <option key={group.id} value={group.id} className="bg-[#1a1a2e] text-white">{group.name}</option>
                                ))}
                            </select>
                        </div>

                        {
                            formData.payGroupId ? (
                                /* Read-only Rates Display */
                                <div className="space-y-3 opacity-80 cursor-not-allowed">
                                    {(() => {
                                        const group = payGroups.find(g => g.id === formData.payGroupId);
                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField label="Hours/Day" value={group?.hoursPerDay} disabled={true} type="number" />
                                                    <InputField label="Hourly Rate" value={group?.hourlyRate} disabled={true} type="number" suffix="R/hr" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <InputField label="Overtime" value={group?.overtimeRate} disabled={true} type="number" suffix="x" />
                                                    <InputField label="Sunday" value={group?.sundayRate} disabled={true} type="number" suffix="x" />
                                                    <InputField label="Holiday" value={group?.publicHolidayRate} disabled={true} type="number" suffix="x" />
                                                </div>
                                            </>
                                        );
                                    })()}
                                    <p className="text-xs text-yellow-500/80 italic mt-2">* Rates are managed by the selected Pay Group</p>
                                </div>
                            ) : (
                                /* Manual Entry fallback REMOVED */
                                <div className="p-4 text-center border border-dashed border-gray-600 rounded-lg">
                                    <p className="text-gray-400 italic">Please select a Pay Group to configure rates.</p>
                                </div>
                            )
                        }
                    </NestedExpandable >

                    {/* Loans */}
                    < NestedExpandable title="Loans" icon={CreditCard} iconColor="#ef4444" >
                        <div className="grid grid-cols-2 gap-3">
                            <InputField
                                label="Total Loan"
                                value={formData.loanTotal}
                                onChange={(v: string) => {
                                    const val = parseFloat(v) || 0;
                                    updateField('loanTotal', val);
                                    const currentOutstanding = formData.loanBalance || 0;
                                    const currentTotal = formData.loanTotal || 0;
                                    if (currentOutstanding === 0 || Math.abs(currentOutstanding - currentTotal) < 1) {
                                        updateField('loanBalance', val);
                                    }
                                }}
                                type="number"
                                suffix="R"
                            />
                            <InputField
                                label="Monthly Deduction"
                                value={formData.loanMonthly}
                                onChange={(v: string) => updateField('loanMonthly', parseFloat(v) || 0)}
                                type="number"
                                suffix="R"
                            />
                        </div>
                        <InputField
                            label="Outstanding Balance"
                            value={formData.loanBalance}
                            onChange={(v: string) => updateField('loanBalance', parseFloat(v) || 0)}
                            type="number"
                            suffix="R"
                        />

                        {/* Maths Display */}
                        {
                            formData.loanBalance > 0 && formData.loanMonthly > 0 && (
                                <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Time to clear:</span>
                                        <span className="text-white font-medium">
                                            {Math.ceil(formData.loanBalance / formData.loanMonthly)} months
                                            <span className="text-gray-500 text-xs ml-1">
                                                (~{Math.ceil((formData.loanBalance / formData.loanMonthly) * 4.33)} weeks)
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                    </NestedExpandable >

                    {/* Savings */}
                    < NestedExpandable title="Savings" icon={PiggyBank} iconColor="#3b82f6" >
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Total Saved" value={formData.savingsTotal} onChange={(v: string) => updateField('savingsTotal', parseFloat(v) || 0)} type="number" suffix="R" disabled />
                            <InputField label="Monthly Contribution" value={formData.savingsMonthly} onChange={(v: string) => updateField('savingsMonthly', parseFloat(v) || 0)} type="number" suffix="R" />
                        </div>
                    </NestedExpandable >

                    {/* Deductions */}
                    < DeductionsSection formData={formData} updateField={updateField} />
                </ExpandableSection >

                {/* Leave */}
                < LeaveSection formData={formData} leaveHistory={leaveHistory} loadingHistory={loadingLeave} />

                {/* Payslips */}
                <PayslipSection staffId={params.id} />

                {/* Bank Details */}
                < ExpandableSection title="Bank Details" icon={Building} iconColor="#8b5cf6" >
                    <div className="space-y-4">
                        <InputField label="Bank Name" value={formData.bankName} onChange={(v: string) => updateField('bankName', v)} icon={Building} />
                        <InputField label="Account Number" value={formData.bankAccount} onChange={(v: string) => updateField('bankAccount', v)} icon={CreditCard} />
                        <InputField label="Branch Code" value={formData.bankBranch} onChange={(v: string) => updateField('bankBranch', v)} icon={FileText} />
                    </div>
                </ExpandableSection >

                {/* ID Info Footer */}
                < div className="card p-4" >
                    <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">Staff ID:</span>
                            <code className="text-xs font-mono">{staff?.id}</code>
                        </div>
                        {staff?.startDate && (
                            <span className="text-xs">Started: {new Date(staff.startDate).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
