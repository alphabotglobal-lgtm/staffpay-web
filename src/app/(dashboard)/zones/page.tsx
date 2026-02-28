'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Plus,
    Users,
    AlertTriangle,
    Trash2,
    ChevronRight,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';

interface Zone {
    id: string;
    name: string;
    description?: string;
    color?: string;
    _count?: {
        staff: number;
        signIns: number;
    };
    // staffCount?: number; // Old flat field
}

export default function ZonesPage() {
    const router = useRouter();
    const [zones, setZones] = useState<Zone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneDescription, setNewZoneDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Loading zones...');
            // Add timestamp to force fresh fetch (nuclear cache busting)
            const data = await apiClient.get<Zone[]>(`/zones?t=${Date.now()}`);
            console.log('Zones loaded:', data.length);
            setZones(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load zones');
            console.error('Load zones error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateZone = async () => {
        if (!newZoneName.trim()) return;

        setIsCreating(true);
        try {
            console.log('Creating zone:', newZoneName);
            await apiClient.post('/zones', {
                name: newZoneName,
                description: newZoneDescription || '',
                color: '#4CAF50',
            });

            console.log('Zone created successfully');
            setNewZoneName('');
            setNewZoneDescription('');
            setShowCreateModal(false);
            loadZones();
        } catch (e: any) {
            console.error('Create error:', e);
            alert('Failed to create zone: ' + (e.message || 'Unknown error'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteZone = async (id: string) => {
        console.log('Delete requested for:', id);

        if (!window.confirm('Delete this zone? This action cannot be undone.')) {
            return;
        }

        // Optimistically remove from UI
        setZones(prev => prev.filter(z => z.id !== id));

        try {
            console.log('Sending delete request...');
            await apiClient.delete(`/zones/${id}`);
            console.log('Delete successful');

            // Refresh absolute truth from server
            loadZones();
        } catch (e: any) {
            console.error('Delete error:', e);
            alert('Failed to delete zone: ' + (e.message || 'Check connection'));
            // Restore list on error
            loadZones();
        }
    };

    const stats = [
        { label: 'Total Zones', value: zones.length, color: 'blue', icon: MapPin },
        { label: 'Total Staff', value: zones.reduce((sum, z) => sum + (z._count?.staff || 0), 0), color: 'green', icon: Users },
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
                        onClick={loadZones}
                        className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border"
                        style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                    >
                        <Plus className="w-5 h-5" />
                        Create Zone
                    </button>
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
                        <h1 className="text-2xl font-semibold text-white">Zone Management</h1>
                        <p className="text-caption">Organize your work zones</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadZones}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                            style={{ border: '1px solid var(--border-color)' }}
                            title="Refresh list"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                        {zones.length > 0 && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                                style={{ background: 'var(--accent-gold)', color: '#000' }}
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Zone</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Zones Grid */}
                {zones.length === 0 ? (
                    <div className="card p-8 text-center">
                        <MapPin className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-white font-medium mb-2">No zones yet</h3>
                        <p className="text-gray-500 mb-4">Create your first zone to get started</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-lg font-medium"
                            style={{ background: 'var(--accent-gold)', color: '#000' }}
                        >
                            Create Zone
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {zones.map((zone) => (
                            <div
                                key={zone.id}
                                onClick={() => router.push(`/zones/${zone.id}`)}
                                className="card p-4 hover:border-opacity-50 hover:bg-white/5 transition cursor-pointer relative"
                                style={{ borderColor: (zone.color || '#4CAF50') + '40' }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: (zone.color || '#4CAF50') + '20' }}
                                        >
                                            <MapPin className="w-6 h-6" style={{ color: zone.color || '#4CAF50' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{zone.name}</h3>
                                            <p className="text-caption">{zone.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteZone(zone.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-red-500/10 transition z-10"
                                        title="Delete Zone"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: zone.color || '#4CAF50' }} />
                                        <span className="text-sm" style={{ color: zone.color || '#4CAF50' }}>{zone._count?.staff || 0} staff</span>
                                    </div>
                                    <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--accent-gold)' }}>
                                        View <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Zone Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="card p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold text-white mb-4">Create New Zone</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-caption block mb-2">Zone Name</label>
                                    <input
                                        type="text"
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        placeholder="e.g. Field East"
                                        className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-500 outline-none"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-caption block mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={newZoneDescription}
                                        onChange={(e) => setNewZoneDescription(e.target.value)}
                                        placeholder="e.g. Sector 3 - Irrigation"
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
                                    onClick={handleCreateZone}
                                    disabled={isCreating || !newZoneName.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                    style={{ background: 'var(--accent-gold)', color: '#000' }}
                                >
                                    {isCreating ? 'Creating...' : 'Create Zone'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
