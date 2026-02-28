'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    UserPlus,
    MapPin,
    Hash,
    ChevronRight,
    Shield,
    Eye,
    RefreshCw,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode?: string;
    zone?: { name: string };
    role?: string;
    status?: string;
    hoursToday?: number;
}

const getRoleColor = (role: string) => {
    switch (role) {
        case 'admin': return { color: 'var(--accent-red)', bg: 'var(--accent-red-bg)' };
        case 'manager': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
        case 'supervisor': return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
        case 'permanent': return { color: 'var(--accent-green)', bg: 'var(--accent-green-bg)' };
        case 'temporary': default: return { color: 'var(--accent-blue)', bg: 'var(--accent-blue-bg)' };
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return { color: 'var(--accent-green)', bg: 'var(--accent-green-bg)' };
        case 'overtime': return { color: 'var(--accent-red)', bg: 'var(--accent-red-bg)' };
        case 'absent': return { color: 'var(--accent-orange)', bg: 'var(--accent-orange-bg)' };
        default: return { color: 'var(--text-muted)', bg: 'rgba(107, 114, 128, 0.15)' };
    }
};

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'admin': return Shield;
        case 'manager': return Users;
        case 'supervisor': return Eye;
        case 'permanent': return UserCheck;
        case 'temporary': default: return Clock;
    }
};

export default function StaffPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [staff, setStaff] = useState<Staff[]>([]);
    const [onShiftStaffIds, setOnShiftStaffIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Get today's date in YYYY-MM-DD
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Fetch staff and roster in parallel
            const [staffData, rosterData] = await Promise.all([
                apiClient.get<Staff[]>('/staff?t=' + Date.now()),
                apiClient.get<any[]>('/rosters?date=' + dateStr + '&t=' + Date.now())
            ]);

            setStaff(Array.isArray(staffData) ? staffData : []);

            // Extract unique staff IDs from today's roster
            if (Array.isArray(rosterData)) {
                const uniqueIds = Array.from(new Set(rosterData.map(a => a.staffId)));
                setOnShiftStaffIds(uniqueIds);
            } else {
                setOnShiftStaffIds([]);
            }
        } catch (e) {
            setError('Failed to load staff');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStaff = staff.filter((s) => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) ||
            (s.employeeCode?.toLowerCase().includes(query)) ||
            (s.zone?.name?.toLowerCase().includes(query));
    });

    const stats = [
        { label: 'Total Staff', value: staff.length, color: 'blue', icon: Users },
        { label: 'On Shift Today', value: onShiftStaffIds.length, color: 'green', icon: UserCheck },
        {
            label: 'Absent',
            value: onShiftStaffIds.filter(id => {
                const member = staff.find(s => s.id === id);
                return !member || !member.hoursToday || member.hoursToday === 0;
            }).length,
            color: 'orange',
            icon: UserX
        },
        { label: 'On Overtime', value: staff.filter(s => (s as any).overtimeToday > 0).length, color: 'red', icon: Clock },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle className="w-12 h-12 text-orange-500" />
                <p className="text-white">{error}</p>
                <div className="flex gap-3">
                    <button
                        onClick={loadStaff}
                        className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium"
                    >
                        Retry
                    </button>
                    <Link
                        href="/staff/create"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border"
                        style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Staff
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Staff Management</h1>
                        <p className="text-caption">Manage your workforce</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <Search className="w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search staff by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-56"
                            />
                        </div>
                        {/* Refresh */}
                        <button
                            onClick={loadStaff}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                            style={{ border: '1px solid var(--border-color)' }}
                        >
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                        {/* Add Staff */}
                        <Link
                            href="/staff/create"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                            style={{ background: 'var(--accent-gold)', color: 'var(--obsidian)' }}
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Add Staff</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        const colorVar = `var(--accent-${stat.color})`;
                        const bgVar = `var(--accent-${stat.color}-bg)`;
                        return (
                            <div key={i} className="stat-card flex items-center gap-4">
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

                {/* Staff Table */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <h2 className="text-h2 text-white">
                            {filteredStaff.length} Staff Members
                            {searchQuery && <span className="text-caption ml-2">(filtered from {staff.length})</span>}
                        </h2>
                    </div>
                    {filteredStaff.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-white font-medium mb-2">
                                {searchQuery ? 'No matching staff' : 'No staff yet'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? 'Try a different search' : 'Add your first staff member to get started'}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/staff/create"
                                    className="inline-block px-4 py-2 rounded-lg font-medium"
                                    style={{ background: 'var(--accent-gold)', color: 'var(--obsidian)' }}
                                >
                                    Add Staff
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left p-4">Staff Member</th>
                                    <th className="text-left p-4">Zone</th>
                                    <th className="text-left p-4">Role</th>
                                    <th className="text-left p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((member) => {
                                    const roleStyle = getRoleColor(member.role || 'staff');
                                    const RoleIcon = getRoleIcon(member.role || 'staff');
                                    return (
                                        <tr key={member.id} className="table-row">
                                            <td className="p-4">
                                                <Link href={`/staff/${member.id}`} className="flex items-center gap-3 hover:opacity-80 transition group">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition group-hover:scale-105" style={{ background: roleStyle.bg }}>
                                                        <RoleIcon className="w-5 h-5" style={{ color: roleStyle.color }} />
                                                    </div>
                                                    <span className="text-sm font-medium text-white group-hover:text-gold transition">
                                                        {member.firstName} {member.lastName}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="text-sm">{member.zone?.name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="badge" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                                                    {(member.role || 'STAFF').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Link
                                                    href={`/staff/${member.id}`}
                                                    className="flex items-center gap-1 text-sm hover:text-white transition"
                                                    style={{ color: 'var(--accent-gold)' }}
                                                >
                                                    View <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
