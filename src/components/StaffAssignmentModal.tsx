import { useState, useEffect } from 'react';
import { X, Search, Check, User, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    photoUrl?: string;
    zoneId?: string;
    zone?: { name: string };
}

interface StaffAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentZoneId: string;
    onAssign: () => void;
}

export default function StaffAssignmentModal({ isOpen, onClose, currentZoneId, onAssign }: StaffAssignmentModalProps) {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAvailableStaff();
            setSelectedIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadAvailableStaff = async () => {
        setIsLoading(true);
        try {
            // Get all staff
            const allStaff = await apiClient.get<Staff[]>('/staff');
            // Filter out staff already in this zone
            // constant check for zoneId or zone object structure from API
            const available = allStaff.filter(s => s.zoneId !== currentZoneId && s.zone?.name !== currentZoneId);
            setStaff(available);
        } catch (e) {
            console.error('Failed to load staff:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleAssign = async () => {
        if (selectedIds.size === 0) return;

        setIsSubmitting(true);
        try {
            // Process assignments in parallel
            await Promise.all(Array.from(selectedIds).map(id =>
                apiClient.put(`/staff/${id}`, { zoneId: currentZoneId })
            ));

            onAssign();
            onClose();
        } catch (e) {
            console.error('Failed to assign staff:', e);
            alert('Failed to assign some staff members. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStaff = staff.filter(s =>
        (s.firstName + ' ' + s.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold text-white">Assign Staff to Zone</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-gold)] transition"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gold" />
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            No available staff found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredStaff.map(member => {
                                const isSelected = selectedIds.has(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => toggleSelection(member.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border border-transparent ${isSelected
                                                ? 'bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/30'
                                                : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected
                                                ? 'bg-gold border-gold'
                                                : 'border-gray-500'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3 text-obsidian" />}
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {member.photoUrl ? (
                                                <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-medium text-white">
                                                    {member.firstName?.[0] || '?'}{member.lastName?.[0] || '?'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                                {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {member.role || 'Staff'} {member.zone?.name ? `• Currently in ${member.zone.name}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)] rounded-b-xl">
                    <span className="text-sm text-gray-400">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={selectedIds.size === 0 || isSubmitting}
                            className="px-4 py-2 rounded-lg bg-gold text-obsidian font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Assigning...' : 'Assign Selected'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
