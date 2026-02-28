'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Trash2,
    Users,
    Briefcase,
    DollarSign,
    Plus,
    Search,
    UserMinus,
    Loader2,
    Clock,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StaffListModal from '@/components/StaffListModal';

import { apiClient } from '@/lib/api/client';

export default function PayGroupDetailPage({ params }: { params: { id: string } }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [group, setGroup] = useState<any>(null);
    const [staffList, setStaffList] = useState<any[]>([]);

    // Staff Selection Modal
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [availableStaff, setAvailableStaff] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated && params.id) {
            loadGroupData();
        }
    }, [isAuthenticated, authLoading, params.id, router]);

    const loadGroupData = async () => {
        setIsLoading(true);
        try {
            // Load Group Details
            const groupData = await apiClient.get<any>(`/pay-groups/${params.id}`);
            if (groupData) {
                setGroup(groupData);
            } else {
                router.push('/pay-groups'); // Redirect if not found
                return;
            }

            // Load all staff to filter by this group
            const allStaff = await apiClient.get<any[]>('/staff');
            if (allStaff) {
                // Filter staff belonging to this group
                setStaffList(allStaff.filter((s: any) => s.payGroupId === params.id));
                // Filter staff NOT in this group (for adding)
                setAvailableStaff(allStaff.filter((s: any) => s.payGroupId !== params.id));
            }
        } catch (e) {
            console.error('Failed to load group data', e);
            router.push('/pay-groups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!group) return;
        setIsSaving(true);
        try {
            const body = {
                name: group.name,
                hoursPerDay: Number(group.hoursPerDay),
                hourlyRate: Number(group.hourlyRate),
                overtimeRate: Number(group.overtimeRate),
                sundayRate: Number(group.sundayRate),
                publicHolidayRate: Number(group.publicHolidayRate),
                calculationMode: group.calculationMode
            };

            await apiClient.put(`/pay-groups/${params.id}`, body);
            alert('Saved successfully');
        } catch (e) {
            console.error(e);
            alert('Error saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStaff = async (staffId: string) => {
        const staffMember = availableStaff.find(s => s.id === staffId);
        if (!staffMember) return;

        try {
            const updatedStaff = { ...staffMember, payGroupId: params.id };
            await apiClient.put(`/staff/${staffId}`, updatedStaff);
            loadGroupData();
            setIsStaffModalOpen(false);
        } catch (e) {
            console.error(e);
            alert('Error adding staff');
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm('Remove staff from this Pay Group?')) return;

        const staffMember = staffList.find(s => s.id === staffId);
        if (!staffMember) return;

        try {
            const updatedStaff = { ...staffMember, payGroupId: null };
            await apiClient.put(`/staff/${staffId}`, updatedStaff);
            loadGroupData();
        } catch (e) {
            console.error(e);
            alert('Error removing staff');
        }
    };

    const handleDeleteGroup = async () => {
        if (staffList.length > 0) {
            alert('Cannot delete group with assigned staff. Remove them first.');
            return;
        }
        if (!confirm('Are you sure you want to delete this Pay Group?')) return;

        try {
            await apiClient.delete(`/pay-groups/${params.id}`);
            router.push('/pay-groups');
        } catch (e) {
            console.error(e);
            alert('Error deleting group');
        }
    };

    if (isLoading || !group) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/pay-groups" className="p-2 rounded-lg hover:bg-white/5 transition">
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                            >
                                <Briefcase className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-white">{group.name}</h1>
                                <p className="text-caption">Pay Group Configuration</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDeleteGroup}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:bg-red-500/20"
                            style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)' }}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                            style={{ background: 'var(--accent-gold)', color: '#1a1a1a' }}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                            <Briefcase className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Group Name</p>
                            <p className="text-white font-bold">{group.name}</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gold-bg)' }}>
                            <Users className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Staff Assigned</p>
                            <p className="stat-number-sm text-white">{staffList.length}</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-orange-bg)' }}>
                            <Clock className="w-6 h-6" style={{ color: 'var(--accent-orange)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Status</p>
                            <span className="badge badge-orange">ACTIVE</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="card p-6 h-[500px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-lg font-semibold text-white">Rates & Rules</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-caption block mb-1">Group Name</label>
                                    <input
                                        type="text"
                                        value={group.name}
                                        onChange={e => setGroup({ ...group, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-caption block mb-1">Base Rate (R/hr)</label>
                                    <input
                                        type="number"
                                        value={group.hourlyRate}
                                        onChange={e => setGroup({ ...group, hourlyRate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-caption block mb-1">Overtime (x)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={group.overtimeRate}
                                            onChange={e => setGroup({ ...group, overtimeRate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-caption block mb-1">Sunday (x)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={group.sundayRate}
                                            onChange={e => setGroup({ ...group, sundayRate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-caption block mb-1">Public Holiday (x)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={group.publicHolidayRate}
                                            onChange={e => setGroup({ ...group, publicHolidayRate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-caption block mb-1">Calculation Mode</label>
                                        <select
                                            value={group.calculationMode || 'true_hours'}
                                            onChange={e => setGroup({ ...group, calculationMode: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                        >
                                            <option value="true_hours">True Hours (Exact)</option>
                                            <option value="fixed_day_wage">Fixed Day Wage + Overtime</option>
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1 italic">
                                            Fixed Day Wage ensures staff gets paid for 1 full day if they signed in.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff List Panel */}
                    <div className="lg:col-span-6">
                        <div className="card h-[500px] flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Assigned Staff</h2>
                                        <p className="text-caption">{staffList.length} members</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsStaffModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white' }}
                                >
                                    <Plus className="w-4 h-4" /> Add Staff
                                </button>
                            </div>

                            <div className="divide-y divide-white/5 overflow-y-auto flex-1 custom-scrollbar">
                                {staffList.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No staff assigned to this group.
                                    </div>
                                ) : (
                                    staffList.map((staff) => (
                                        <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-white">
                                                        {staff.firstName[0]}{staff.lastName[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/staff/${staff.id}`}
                                                        className="font-medium text-white hover:text-gold transition block"
                                                    >
                                                        {staff.firstName} {staff.lastName}
                                                    </Link>
                                                    <p className="text-caption">{staff.role || 'Staff'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveStaff(staff.id)}
                                                className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                title="Remove from group"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal for adding staff */}
                {isStaffModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsStaffModalOpen(false)}>
                        <div className="card w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white">Add Staff to {group.name}</h3>
                                <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {availableStaff.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">No available staff to add.</p>
                                ) : (
                                    availableStaff.map(staff => (
                                        <button
                                            key={staff.id}
                                            onClick={() => handleAddStaff(staff.id)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                                {staff.firstName[0]}{staff.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{staff.firstName} {staff.lastName}</p>
                                                <p className="text-caption">{staff.role || 'Staff'} • {staff.payGroup?.name || 'No Group'}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-gold ml-auto" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
