'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Plus,
    ChevronRight,
    ChevronDown,
    Users,
    Trash2,
    DollarSign,
    Loader2,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

interface PayGroup {
    id: string;
    name: string;
    _count?: {
        staff: number;
    };
}

export default function PayGroupsPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [payGroups, setPayGroups] = useState<PayGroup[]>([]);
    const [unassignedStaff, setUnassignedStaff] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUnassignedModal, setShowUnassignedModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            loadPayGroups();
            loadUnassignedStaff();
        }
    }, [isAuthenticated, authLoading, router]);

    const loadPayGroups = async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const data = await apiClient.get<PayGroup[]>('/pay-groups');
            setPayGroups(data || []);
        } catch (e) {
            console.error('Failed to load pay groups', e);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    };

    const loadUnassignedStaff = async (isSilent = false) => {
        try {
            const data = await apiClient.get<any[]>('/pay-groups/unassigned');
            setUnassignedStaff(data || []);
        } catch (e) {
            console.error('Failed to load unassigned staff', e);
        }
    };

    const handleCreate = async () => {
        if (!newGroupName.trim()) return;

        setIsCreating(true);
        try {
            await apiClient.post('/pay-groups', {
                name: newGroupName,
                hourlyRate: 0,
                overtimeRate: 1.5,
                sundayRate: 2.0,
                publicHolidayRate: 2.0,
                hoursPerDay: 8
            });
            setNewGroupName('');
            setShowCreateModal(false);
            loadPayGroups();
        } catch (e) {
            console.error(e);
            alert('Error creating group');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure? This will unassign all staff in this group.')) return;

        try {
            await apiClient.delete(`/pay-groups/${id}`);
            loadPayGroups();
        } catch (e) {
            console.error(e);
            alert('Error deleting group');
        }
    };

    const stats = [
        { label: 'Total Pay Groups', value: payGroups.length, color: 'blue', icon: Briefcase },
        { label: 'Assigned Staff', value: payGroups.reduce((sum, g) => sum + (g._count?.staff || 0), 0), color: 'green', icon: Users },
        { label: 'Unassigned Staff', value: unassignedStaff.length, color: 'orange', icon: DollarSign, onClick: () => setShowUnassignedModal(true) },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Pay Groups</h1>
                        <p className="text-caption">Manage payroll categories and assignments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadPayGroups()}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                            style={{ border: '1px solid var(--border-color)' }}
                            title="Refresh list"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                            style={{ background: 'var(--accent-gold)', color: '#1a1a1a' }}
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Pay Group</span>
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        const colorVar = `var(--accent-${stat.color})`;
                        const bgVar = `var(--accent-${stat.color}-bg)`;
                        return (
                            <div
                                key={i}
                                className={`stat-card flex items-center gap-4 ${stat.onClick ? 'cursor-pointer hover:bg-white/5 transition border-2 border-transparent hover:border-[var(--accent-orange)]' : ''}`}
                                style={stat.onClick ? {} : { background: bgVar }}
                                onClick={stat.onClick}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bgVar }}>
                                    <Icon className="w-6 h-6" style={{ color: colorVar }} />
                                </div>
                                <div>
                                    <p className="text-caption">{stat.label}</p>
                                    <p className="stat-number-sm text-white">{stat.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pay Groups Grid */}
                {payGroups.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-white font-medium mb-2">No pay groups yet</h3>
                        <p className="text-gray-500 mb-4">Create your first group to get started</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-lg font-medium"
                            style={{ background: 'var(--accent-gold)', color: '#1a1a1a' }}
                        >
                            Create Pay Group
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {payGroups.map((group) => <PayGroupCard key={group.id} group={group} router={router} onDelete={handleDelete} />)}
                    </div>
                )}

                {/* Create Pay Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="card p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold text-white mb-4">Create Pay Group</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-caption block mb-2">Group Name</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="e.g. Permanent Staff"
                                        className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 outline-none"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg transition text-gray-400 hover:text-white"
                                    style={{ border: '1px solid var(--border-color)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !newGroupName.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                    style={{ background: 'var(--accent-gold)', color: '#1a1a1a' }}
                                >
                                    {isCreating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showUnassignedModal && (
                    <UnassignedStaffModal
                        staff={unassignedStaff}
                        payGroups={payGroups}
                        onClose={() => setShowUnassignedModal(false)}
                        onAssigned={() => {
                            loadPayGroups(true);
                            loadUnassignedStaff(true);
                        }}
                    />
                )}
            </div>
        </div>
    );

}

function PayGroupCard({ group, router, onDelete }: { group: PayGroup, router: any, onDelete: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="card overflow-hidden transition-all duration-300"
            style={{ borderColor: 'var(--border-color)' }}
        >
            <div
                onClick={() => router.push(`/pay-groups/${group.id}`)}
                className="p-4 hover:bg-white/5 transition cursor-pointer"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--accent-blue-bg)' }}
                        >
                            <Briefcase className="w-6 h-6 text-[var(--accent-blue)]" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">{group.name}</h3>
                            <p className="text-caption">Payroll Category</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button
                            onClick={(e) => onDelete(e, group.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition"
                            title="Delete Pay Group"
                        >
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--accent-blue)]" />
                        <span className="text-sm text-[var(--accent-blue)] font-medium">{group._count?.staff || 0} assigned</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--accent-gold)' }}>
                        Details <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 bg-white/2 pt-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Capabilities</p>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Fixed Monthly Payout</span>
                            <span className="text-[var(--accent-gold)]">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Overtime Calculations</span>
                            <span className="text-[var(--accent-gold)]">Enabled</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UnassignedStaffModal({ staff, payGroups, onClose, onAssigned }: { staff: any[], payGroups: PayGroup[], onClose: () => void, onAssigned: () => void }) {
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const handleAssign = async () => {
        if (!selectedStaff || !selectedGroup) return;
        setIsAssigning(true);
        try {
            await apiClient.post(`/pay-groups/${selectedGroup}/assign-staff`, { staffId: selectedStaff });
            setSelectedStaff(null);
            onAssigned();
        } catch (e) {
            console.error(e);
            alert('Error assigning staff');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-[var(--accent-orange)]" />
                            Unassigned Staff
                        </h2>
                        <p className="text-caption">The following staff members have no pay group assigned</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition text-gray-400">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {staff.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No unassigned staff members found.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {staff.map((s) => (
                                <div
                                    key={s.id}
                                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${selectedStaff === s.id ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                                    onClick={() => setSelectedStaff(s.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                            {s.firstName[0]}{s.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{s.firstName} {s.lastName}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{s.employeeCode}</p>
                                        </div>
                                    </div>
                                    {selectedStaff === s.id && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                            <select
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                                value={selectedGroup}
                                                onChange={(e) => setSelectedGroup(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="">Select Group...</option>
                                                {payGroups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                disabled={!selectedGroup || isAssigning}
                                                className="bg-gold text-obsidian px-3 py-1 rounded-lg text-xs font-bold hover:scale-105 transition disabled:opacity-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAssign();
                                                }}
                                            >
                                                {isAssigning ? '...' : 'Assign'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition border border-white/10 text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
