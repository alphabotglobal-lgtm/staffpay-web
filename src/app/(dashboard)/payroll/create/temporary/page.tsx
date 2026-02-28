'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Calendar, Users, CheckSquare, Square, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    zone?: { name: string };
    role?: string;
    hourlyRate?: number;
}

export default function TemporaryPayslipPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    const [generatedPayslips, setGeneratedPayslips] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [payPeriod, setPayPeriod] = useState({
        start: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
        end: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/staff`);
            if (!res.ok) throw new Error('Failed to fetch staff');
            const data = await res.json();
            // Filter for temporary staff (role = 'temporary' or 'staff')
            const tempStaff = data.filter((s: Staff) => s.role === 'temporary' || s.role === 'staff' || !s.role);
            setStaff(tempStaff);
        } catch (e) {
            setError('Failed to load staff');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStaff = (id: string) => {
        setSelectedStaff(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedStaff.length === staff.length) {
            setSelectedStaff([]);
        } else {
            setSelectedStaff(staff.map(s => s.id));
        }
    };

    const generatePayslips = async () => {
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        setGeneratedPayslips(selectedStaff);
        setIsGenerating(false);
    };

    const downloadPayslip = (staffId: string) => {
        const member = staff.find(s => s.id === staffId);
        if (!member) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const dailyRate = (member.hourlyRate || 25) * 8;
        const daysWorked = 5; // Placeholder
        const totalPay = dailyRate * daysWorked;

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(255, 140, 0);
        doc.text('TEMPORARY WORKER', pageWidth / 2, 28, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('StaffPay', pageWidth / 2, 36, { align: 'center' });

        doc.setDrawColor(200);
        doc.line(20, 42, pageWidth - 20, 42);

        doc.setFontSize(10);
        doc.text(`Pay Period: ${payPeriod.start} to ${payPeriod.end}`, 20, 52);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 52, { align: 'right' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Worker Details', 20, 65);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        let y = 73;
        doc.text('Worker ID:', 20, y);
        doc.text(member.id, 70, y);
        y += 7;
        doc.text('Full Name:', 20, y);
        doc.text(`${member.firstName} ${member.lastName}`, 70, y);
        y += 7;
        doc.text('Zone:', 20, y);
        doc.text(member.zone?.name || 'Unassigned', 70, y);
        y += 7;
        doc.text('Role:', 20, y);
        doc.text(member.role || 'Temporary', 70, y);

        y += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Earnings', 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Daily Rate:`, 20, y);
        doc.text(`R ${dailyRate}`, 120, y, { align: 'right' });
        y += 7;
        doc.text(`Days Worked:`, 20, y);
        doc.text(`${daysWorked}`, 120, y, { align: 'right' });

        y += 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PAY:', 20, y);
        doc.text(`R ${totalPay.toLocaleString()}`, 120, y, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a computer-generated document.', pageWidth / 2, 280, { align: 'center' });

        doc.save(`Payslip_${member.id}_${member.firstName}_${member.lastName}_${payPeriod.end}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0f0a] flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="w-12 h-12 text-orange-500" />
                <p className="text-white">{error}</p>
                <button
                    onClick={loadStaff}
                    className="px-4 py-2 bg-orange-500 text-black rounded-lg font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f0a]">
            {/* Header */}
            <header className="bg-[#111] border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/payroll/create" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Temporary Staff Payslips</h1>
                        <p className="text-sm text-white/50">Generate payslips for temporary workers</p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {/* Pay Period Selector */}
                <div className="bg-[#1a1f1a] rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold">Pay Period</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-white/50 block mb-1">Start Date</label>
                            <input
                                type="date"
                                value={payPeriod.start}
                                onChange={e => setPayPeriod(p => ({ ...p, start: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 block mb-1">End Date</label>
                            <input
                                type="date"
                                value={payPeriod.end}
                                onChange={e => setPayPeriod(p => ({ ...p, end: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Staff Selection */}
                <div className="bg-[#1a1f1a] rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-orange-400" />
                            <span className="font-semibold">Select Workers</span>
                            <span className="text-sm text-white/50">({selectedStaff.length} of {staff.length} selected)</span>
                        </div>
                        <button
                            onClick={selectAll}
                            className="text-sm text-orange-400 hover:underline"
                        >
                            {selectedStaff.length === staff.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    {staff.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-500">No temporary staff found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {staff.map(member => {
                                const dailyRate = (member.hourlyRate || 25) * 8;
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => toggleStaff(member.id)} className="text-orange-400">
                                                {selectedStaff.includes(member.id) ? (
                                                    <CheckSquare className="w-5 h-5" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-white/30" />
                                                )}
                                            </button>
                                            <div>
                                                <p className="font-medium">{member.firstName} {member.lastName}</p>
                                                <p className="text-sm text-white/50">{member.zone?.name || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right min-w-[80px]">
                                                <p className="font-semibold text-orange-400">R{dailyRate}/day</p>
                                            </div>

                                            {generatedPayslips.includes(member.id) ? (
                                                <button
                                                    onClick={() => downloadPayslip(member.id)}
                                                    className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                                                    title="Download Payslip"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="p-2 text-white/20">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    onClick={generatePayslips}
                    disabled={selectedStaff.length === 0 || isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Payslips...
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5" />
                            Generate Payslips ({selectedStaff.length})
                        </>
                    )}
                </button>

                {generatedPayslips.length > 0 && (
                    <p className="text-center text-sm text-orange-400">
                        ✓ {generatedPayslips.length} payslip(s) ready for download
                    </p>
                )}
            </main>
        </div>
    );
}
