'use client';
import { useState, useEffect } from 'react';
import {
    Users, Calendar, Clock, AlertTriangle,
    Plus, Search, Loader2, ChevronRight,
    Trash2, Save, X, DollarSign, Briefcase,
    ArrowUpCircle, ArrowDownCircle, FileEdit,
    History, MapPin, CheckCircle2, Info
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Staff {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    facePhotoUrl?: string;
    loanBalance: string;
    annualLeaveBalance: string;
}

interface Intervention {
    id: string;
    staffId: string;
    type: string;
    details: string;
    timestamp: string;
    author: string;
    staff: Staff;
    newData?: any;
}

export default function OverridesPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [activeTab, setActiveTab] = useState<'hours' | 'shifts' | 'leave' | 'loan'>('hours');

    // Form States
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [value, setValue] = useState<number | string>('');
    const [subType, setSubType] = useState('regular');
    const [operation, setOperation] = useState('add');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [staffRes, intRes] = await Promise.all([
                fetch(`${API_URL}/staff`),
                fetch(`${API_URL}/adjustments`)
            ]);
            if (staffRes.ok) setStaffList(await staffRes.json());
            if (intRes.ok) {
                const data = await intRes.json();
                setInterventions(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStaff || !value || !details) return;
        setIsSubmitting(true);
        try {
            const typeMap: Record<string, string> = {
                hours: 'hours',
                shifts: operation === 'add' ? 'add_shift' : 'remove_shift',
                leave: 'leave',
                loan: 'loan'
            };

            const payload = {
                staffId: selectedStaff.id,
                type: typeMap[activeTab],
                subType: subType,
                operation: operation,
                date: new Date(date),
                value: Number(value),
                details,
                author: 'Admin'
            };

            const res = await fetch(`${API_URL}/adjustments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setDetails('');
                setValue('');
                loadData();
                alert('Adjustment saved successfully');
            } else {
                alert('Failed to save adjustment');
            }
        } catch (e) {
            alert('Error submitting adjustment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStaff = staffList.filter(s =>
        `${s.firstName} ${s.lastName} ${s.employeeCode}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Overrides</h1>
                        <p className="text-caption">Centralized manual intervention for payroll, leave, and loans</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 glass rounded-lg flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{interventions.length} Recent Actions</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Staff Selection */}
                    <div className="card h-fit lg:col-span-1">
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search Staff..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[var(--accent-gold)] transition outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5">
                            {isLoading ? (
                                <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
                            ) : filteredStaff.map(staff => (
                                <button
                                    key={staff.id}
                                    onClick={() => setSelectedStaff(staff)}
                                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition text-left ${selectedStaff?.id === staff.id ? 'bg-[var(--accent-gold-bg)] !border-l-2 border-[var(--accent-gold)]' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
                                        {staff.facePhotoUrl && (staff.facePhotoUrl.startsWith('http') || staff.facePhotoUrl.startsWith('/uploads')) ? (
                                            <img src={staff.facePhotoUrl.startsWith('http') ? staff.facePhotoUrl : `${API_URL}${staff.facePhotoUrl}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-gray-600" /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{staff.firstName} {staff.lastName}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{staff.employeeCode}</p>
                                    </div>
                                    <ChevronRight className="ml-auto w-4 h-4 text-gray-600 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Adjustment Panel */}
                    <div className="lg:col-span-3 space-y-6">
                        {selectedStaff ? (
                            <div className="card glass-glow overflow-hidden">
                                <div className="p-4 bg-[var(--accent-gold-bg)] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full ring-2 ring-[var(--accent-gold)] overflow-hidden">
                                            {selectedStaff.facePhotoUrl && (selectedStaff.facePhotoUrl.startsWith('http') || selectedStaff.facePhotoUrl.startsWith('/uploads')) ? (
                                                <img src={selectedStaff.facePhotoUrl.startsWith('http') ? selectedStaff.facePhotoUrl : `${API_URL}${selectedStaff.facePhotoUrl}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5"><Users className="w-6 h-6 text-gray-600" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                                            <p className="text-xs text-[var(--accent-gold)] font-bold">{selectedStaff.employeeCode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Loan Balance</p>
                                            <p className="text-sm font-bold text-red-400">R{Number(selectedStaff.loanBalance).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Annual Leave</p>
                                            <p className="text-sm font-bold text-blue-400">{Number(selectedStaff.annualLeaveBalance).toFixed(1)}d</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-1 glass flex border-b border-white/10">
                                    {[
                                        { id: 'hours', label: 'Adjust Hours', icon: Clock },
                                        { id: 'shifts', label: 'Add/Remove Shift', icon: Calendar },
                                        { id: 'leave', label: 'Add/Subtract Leave', icon: Briefcase },
                                        { id: 'loan', label: 'Modify Loan', icon: DollarSign },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id as any);
                                                setValue('');
                                                setOperation(tab.id === 'shifts' ? 'add' : 'add');
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition ${activeTab === tab.id ? 'text-[var(--accent-gold)] bg-white/5' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[var(--accent-gold)]"
                                                value={date}
                                                onChange={e => setDate(e.target.value)}
                                            />
                                        </div>

                                        {activeTab === 'hours' && (
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Hour Type</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[var(--accent-gold)]"
                                                    value={subType}
                                                    onChange={e => setSubType(e.target.value)}
                                                >
                                                    <option value="regular">Regular</option>
                                                    <option value="overtime">Overtime (1.5x)</option>
                                                    <option value="sunday">Sunday (2.0x)</option>
                                                    <option value="public_holiday">Public Holiday (2.0x)</option>
                                                </select>
                                            </div>
                                        )}

                                        {activeTab === 'shifts' && (
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Action</label>
                                                <div className="flex glass p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setOperation('add')}
                                                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded transition ${operation === 'add' ? 'bg-gold text-obsidian shadow-lg shadow-gold/20' : 'text-gray-500'}`}
                                                    >Add Shift</button>
                                                    <button
                                                        onClick={() => setOperation('subtract')}
                                                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded transition ${operation === 'subtract' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500'}`}
                                                    >Remove Shift</button>
                                                </div>
                                            </div>
                                        )}

                                        {(activeTab === 'leave' || activeTab === 'loan') && (
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Adjustment Paramaters</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[var(--accent-gold)]"
                                                        value={subType}
                                                        onChange={e => setSubType(e.target.value)}
                                                    >
                                                        {activeTab === 'leave' ? (
                                                            <>
                                                                <option value="annual">Annual Leave</option>
                                                                <option value="sick">Sick Leave</option>
                                                                <option value="family">Family/Rel</option>
                                                                <option value="unpaid">Unpaid Leave</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="add">Add Credit</option>
                                                                <option value="subtract">Manual Repayment</option>
                                                            </>
                                                        )}
                                                    </select>
                                                    <div className="flex glass p-1 rounded-lg">
                                                        <button
                                                            onClick={() => setOperation('add')}
                                                            className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition ${operation === 'add' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500'}`}
                                                        >Increase</button>
                                                        <button
                                                            onClick={() => setOperation('subtract')}
                                                            className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition ${operation === 'subtract' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500'}`}
                                                        >Decrease</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                {activeTab === 'hours' ? 'Number of Hours' : activeTab === 'leave' ? 'Number of Days' : activeTab === 'loan' ? 'Amount (Rand)' : (operation === 'add' ? 'Estimated Hours' : 'Confirm Date')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-xl font-bold outline-none focus:border-[var(--accent-gold)]"
                                                    value={value}
                                                    onChange={e => setValue(e.target.value)}
                                                    disabled={activeTab === 'shifts' && operation === 'subtract'}
                                                />
                                                {activeTab === 'loan' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Internal Audit Reason</label>
                                            <textarea
                                                placeholder="Why is this override being made?"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--accent-gold)] min-h-[52px] h-[52px] resize-none"
                                                value={details}
                                                onChange={e => setDetails(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (!value && !(activeTab === 'shifts' && operation === 'subtract')) || !details}
                                        className="w-full bg-gold text-obsidian font-black uppercase tracking-widest py-4 rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Commit Manual Adjustment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="card glass p-20 text-center flex flex-col items-center justify-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center animate-pulse">
                                    <Users className="w-10 h-10 text-gray-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Select a Staff Member</h2>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">Choose a team member from the list to start making manual overrides, adding shifts, or adjusting balances.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-white/10" />
                                    <div className="w-2 h-2 rounded-full bg-white/10" />
                                    <div className="w-2 h-2 rounded-full bg-white/10" />
                                </div>
                            </div>
                        )}

                        {/* Recent Log */}
                        <div className="card overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <h2 className="text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2">
                                    <History className="w-4 h-4 text-[var(--accent-gold)]" />
                                    Central Audit Log
                                </h2>
                                <button onClick={loadData} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest transition">
                                    Refresh Log
                                </button>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5">
                                {interventions.length > 0 ? interventions
                                    .filter(i => !selectedStaff || i.staffId === selectedStaff.id)
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map(item => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                                                    <p className="text-sm font-black text-white">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div className="h-10 w-[2px] bg-white/10 group-hover:bg-[var(--accent-gold)] transition-colors" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-white">{item.staff?.firstName || 'Unknown'} {item.staff?.lastName || ''}</p>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ring-1 ring-inset ${item.type === 'payroll_adjustment' ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20' :
                                                            item.type === 'leave_adjustment' ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20' :
                                                                item.type === 'shift_removal' ? 'bg-red-500/10 text-red-400 ring-red-500/20' :
                                                                    'bg-green-500/10 text-green-400 ring-green-500/20'
                                                            }`}>
                                                            {item.type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-md line-clamp-1">{item.details}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[var(--accent-gold)]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Active
                                                </div>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase">Managed by: {item.author || 'System'}</p>
                                            </div>
                                        </div>
                                    )) : (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-700" />
                                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Waiting for activities...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
