'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    Users,
    Edit,
    Trash2,
    Save,
    X,
    Clock,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Zone {
    id: string;
    name: string;
    description?: string;
    color?: string;
    staffCount?: number;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
}

export default function ZoneDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [zone, setZone] = useState<Zone | null>(null);
    const [staffInZone, setStaffInZone] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);

    useEffect(() => {
        loadZone();
    }, [params.id]);

    const loadZone = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch fresh data
            const data = await apiClient.get<Zone>(`/zones/${params.id}?t=${Date.now()}`);
            setZone(data);
            setFormData({ name: data.name, description: data.description || '' });

            // Load staff in zone
            const staffData = await apiClient.get<Staff[]>(`/staff?zoneId=${params.id}&t=${Date.now()}`);
            setStaffInZone(staffData);
        } catch (e) {
            setError('Zone not found');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!zone) return;
        setIsSaving(true);
        try {
            // Use PUT for update
            const updated = await apiClient.put<Zone>(`/zones/${zone.id}`, formData);
            setZone(updated);
            setEditMode(false);
        } catch (e) {
            console.error(e);
            alert('Failed to save zone');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!zone || !confirm('Are you sure you want to delete this zone?')) return;
        try {
            await apiClient.delete(`/zones/${zone.id}`);
            router.push('/zones');
        } catch (e) {
            console.error(e);
            alert('Failed to delete zone');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !zone) {
        return (
            <div className="space-y-6">
                <Link href="/zones" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Zones</span>
                </Link>
                <div className="card p-12 text-center">
                    <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Zone Not Found</h2>
                    <p className="text-caption">The zone you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const zoneColor = zone.color || '#4CAF50';

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/zones" className="p-2 rounded-lg hover:bg-white/5 transition">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: zoneColor + '20' }}
                        >
                            <MapPin className="w-6 h-6" style={{ color: zoneColor }} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-white">{zone.name}</h1>
                            <p className="text-caption">{zone.description || 'No description'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-400 hover:text-white"
                                style={{ border: '1px solid var(--border-color)' }}
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                style={{ background: 'var(--accent-gold)', color: '#000' }}
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-400 hover:text-white"
                                style={{ border: '1px solid var(--border-color)' }}
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:bg-red-500/20"
                                style={{ background: 'var(--accent-red-bg)', color: 'var(--accent-red)' }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="stat-card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gold-bg)' }}>
                        <Users className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                    </div>
                    <div>
                        <p className="text-caption">Staff Assigned</p>
                        <p className="stat-number-sm text-white">{staffInZone.length}</p>
                    </div>
                </div>
                <div className="stat-card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                        <Clock className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div>
                        <p className="text-caption">Status</p>
                        <span className="badge badge-green">ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Zone Details */}
            <div className="card p-6">
                <h3 className="text-h2 text-white mb-4">Zone Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-caption block mb-1">Zone Name</label>
                        {editMode ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                            />
                        ) : (
                            <p className="text-white font-medium">{zone.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1">Description</label>
                        {editMode ? (
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg text-white outline-none"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                            />
                        ) : (
                            <p className="text-white font-medium">{zone.description || 'No description'}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1">Color</label>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded" style={{ background: zoneColor }}></div>
                            <span className="text-white font-mono text-sm">{zoneColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-caption block mb-1">Zone ID</label>
                        <p className="text-gray-400 font-mono text-sm">{zone.id}</p>
                    </div>
                </div>
            </div>

            {/* Staff in Zone */}
            <div className="card">
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                        <h3 className="text-h2 text-white">Staff in Zone</h3>
                        <span className="text-caption bg-white/5 px-2 py-0.5 rounded-full">{staffInZone.length}</span>
                    </div>
                    <button
                        onClick={() => setShowAssignmentModal(true)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] hover:bg-gold hover:text-obsidian transition font-medium"
                    >
                        + Add Staff
                    </button>
                </div>
                {staffInZone.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-500" />
                        </div>
                        <h4 className="text-white font-medium mb-1">No staff assigned</h4>
                        <p className="text-gray-500 text-sm mb-4">Assign staff members to this zone to track their activity.</p>
                        <button
                            onClick={() => setShowAssignmentModal(true)}
                            className="px-4 py-2 rounded-lg bg-gold text-obsidian font-medium"
                        >
                            Assign Staff
                        </button>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {staffInZone.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg group hover:bg-white/5 transition" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                    </div>
                                    <div>
                                        <Link
                                            href={`/staff/${member.id}`}
                                            className="font-medium text-white hover:text-gold transition block"
                                        >
                                            {member.firstName} {member.lastName}
                                        </Link>
                                        <p className="text-xs text-gray-400">{member.role || 'Staff'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Remove ${member.firstName} from this zone?`)) return;
                                        try {
                                            await apiClient.put(`/staff/${member.id}`, { zoneId: null });
                                            loadZone(); // Refresh list
                                        } catch (e) {
                                            alert('Failed to remove staff');
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    title="Remove from zone"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <StaffAssignmentModal
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                currentZoneId={zone.id}
                onAssign={loadZone}
            />
        </div>
    );
}

import StaffAssignmentModal from '@/components/StaffAssignmentModal';
