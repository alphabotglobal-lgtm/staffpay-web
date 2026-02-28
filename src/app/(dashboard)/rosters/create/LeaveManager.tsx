import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, Loader2, Check, User } from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';

interface LeaveManagerProps {
    zones: any[];
    allStaff: any[];
    weekDates: any[];
    weekStartDate: Date;
}

export function LeaveManager({ zones, allStaff, weekDates, weekStartDate }: LeaveManagerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedType, setExpandedType] = useState<string | null>(null);

    // Selection State
    const [selectedZoneId, setSelectedZoneId] = useState<string>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

    // Pending items to be saved
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const leaveTypes = [
        'Paid Leave',
        'Unpaid Leave',
        'Sick Leave',
        'Compassionate Leave',
        'Custom Leave Paid',
        'Custom Leave Unpaid'
    ];

    // Filter staff by zone
    const zoneStaff = useMemo(() => {
        if (!selectedZoneId || !Array.isArray(allStaff)) return [];
        return allStaff.filter(s => s.zoneId === selectedZoneId);
    }, [selectedZoneId, allStaff]);

    const toggleDay = (idx: number) => {
        const newSet = new Set(selectedDays);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setSelectedDays(newSet);
    };

    const handleAdd = () => {
        if (!selectedStaffId || !expandedType || selectedDays.size === 0) return;

        const staff = allStaff.find(s => s.id === selectedStaffId);

        const newItems = Array.from(selectedDays).map(dayIdx => ({
            staffId: selectedStaffId,
            staffName: `${staff?.firstName} ${staff?.lastName}`,
            type: expandedType,
            date: weekDates[dayIdx].fullDate,
            dayName: weekDates[dayIdx].name,
            dayIdx
        }));

        setPendingItems([...pendingItems, ...newItems]);

        // Reset selection (keep zone/staff maybe? No, reset for fresh start)
        setSelectedDays(new Set());
        // keep staff selected for quick sequential adds
    };

    const handleRemovePending = (idx: number) => {
        const newItems = [...pendingItems];
        newItems.splice(idx, 1);
        setPendingItems(newItems);
    };

    const handleSave = async () => {
        if (pendingItems.length === 0) return;
        setIsSaving(true);
        try {
            // Transform for API
            const payload = {
                items: pendingItems.map(item => ({
                    staffId: item.staffId,
                    type: item.type,
                    date: item.date
                }))
            };

            await apiClient.post('/leave/bulk-roster', payload);

            alert('Leave saved successfully!');
            setPendingItems([]);
        } catch (e) {
            console.error(e);
            alert('Failed to save leave.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card overflow-hidden border-t-4 border-yellow-500/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div>
                    <h3 className="text-lg font-bold text-white">Leave Management</h3>
                    <p className="text-caption">Assign paid/unpaid leave to staff</p>
                </div>
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-white/10 space-y-4">

                    {/* Leave Types Accordion */}
                    <div className="space-y-2">
                        {leaveTypes.map(type => (
                            <div key={type} className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                                <button
                                    onClick={() => setExpandedType(expandedType === type ? null : type)}
                                    className={`w-full flex items-center justify-between p-3 text-sm font-medium transition ${expandedType === type ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {type}
                                    {expandedType === type ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {expandedType === type && (
                                    <div className="p-4 bg-black/40 space-y-4">
                                        {/* 1. Zone Tunnel */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">1. Select Zone</label>
                                                <select
                                                    value={selectedZoneId}
                                                    onChange={e => {
                                                        setSelectedZoneId(e.target.value);
                                                        setSelectedStaffId('');
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                >
                                                    <option value="">-- Choose Zone --</option>
                                                    {Array.isArray(zones) && zones.map(z => (
                                                        <option key={z.id} value={z.id}>{z.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">2. Select Staff</label>
                                                <select
                                                    value={selectedStaffId}
                                                    onChange={e => setSelectedStaffId(e.target.value)}
                                                    disabled={!selectedZoneId}
                                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                                                >
                                                    <option value="">-- Choose Staff --</option>
                                                    {Array.isArray(zoneStaff) && zoneStaff.map(s => (
                                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 3. Days Ticker */}
                                        {selectedStaffId && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <label className="text-xs text-gray-500 mb-2 block">3. Select Days</label>
                                                <div className="flex gap-2">
                                                    {weekDates.map((day, idx) => {
                                                        const isSelected = selectedDays.has(idx);
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => toggleDay(idx)}
                                                                className={`flex-1 py-2 rounded text-center text-xs transition ${isSelected ? 'bg-yellow-500 text-black font-bold' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                            >
                                                                <div>{day.name}</div>
                                                                <div>{day.date}</div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                <button
                                                    onClick={handleAdd}
                                                    disabled={selectedDays.size === 0}
                                                    className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded flex items-center justify-center gap-2 transition disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add to List
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pending Items List */}
                    {pendingItems.length > 0 && (
                        <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-bold text-white mb-2">Pending Changes ({pendingItems.length})</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {pendingItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                                        <div>
                                            <span className="text-yellow-500 font-medium">{item.type}</span>
                                            <span className="text-gray-400 mx-2">•</span>
                                            <span className="text-white">{item.staffName}</span>
                                            <span className="text-gray-400 mx-2">•</span>
                                            <span className="text-gray-300">{item.dayName} {new Date(item.date).getDate()}</span>
                                        </div>
                                        <button onClick={() => handleRemovePending(idx)} className="text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded flex items-center justify-center gap-2 transition"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Leave Changes
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
