'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Users,
    ChevronDown,
    ChevronRight,
    Sunrise,
    Sunset,
    Coffee,
    Save,
    Loader2,
    AlertTriangle,
    Check,
    Circle,
    FileText
} from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';
import { TemplateModal } from './TemplateModal';
import { LeaveManager } from './LeaveManager';

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
    startTime?: string;
    finishTime?: string;
    lunchLength?: number;
    zoneId?: string;
}

const getThisMonday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now.setDate(now.getDate() + diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const getUpcomingMonday = () => {
    const monday = getThisMonday();
    monday.setDate(monday.getDate() + 7);
    return monday;
};

const getWeekDates = (startDate: Date) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((name, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return { name, date: date.getDate(), fullDate: date };
    });
};

export default function CreateRosterPage() {
    const router = useRouter();
    const [zones, setZones] = useState<Zone[]>([]);
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedZone, setExpandedZone] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [selections, setSelections] = useState<Record<string, Record<number, Set<string>>>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState(getUpcomingMonday());
    const [weekHolidays, setWeekHolidays] = useState<any[]>([]);

    // Shift Times State
    const [startTime, setStartTime] = useState('07:00');
    const [finishTime, setFinishTime] = useState('17:00');
    const [lunchLength, setLunchLength] = useState(30);

    // Template Modal State
    const [templateModal, setTemplateModal] = useState<{
        isOpen: boolean;
        type: 'global' | 'zone';
        zoneId?: string;
        zoneName?: string;
    }>({ isOpen: false, type: 'global' });

    const weekDates = getWeekDates(weekStartDate);
    const holidaySet = new Set(weekHolidays.map((h: any) => h.date.split('T')[0]));
    const holidayNameMap = new Map(weekHolidays.map((h: any) => [h.date.split('T')[0], h.name]));

    const openTemplateModal = (type: 'global' | 'zone', zoneId?: string, zoneName?: string) => {
        setTemplateModal({ isOpen: true, type, zoneId, zoneName });
    };

    const serializeSelections = (data: any, isGlobal: boolean) => {
        if (isGlobal) {
            const result: any = {};
            Object.entries(data).forEach(([zoneId, dayRecord]: [string, any]) => {
                result[zoneId] = {};
                Object.entries(dayRecord).forEach(([day, staffSet]: [string, any]) => {
                    result[zoneId][day] = Array.from(staffSet);
                });
            });
            return result;
        } else {
            const result: any = {};
            Object.entries(data).forEach(([day, staffSet]: [string, any]) => {
                result[day] = Array.from(staffSet);
            });
            return result;
        }
    };

    const deserializeSelections = (data: any, isGlobal: boolean) => {
        if (!data) return {};

        if (isGlobal) {
            const result: any = {};
            Object.entries(data).forEach(([zoneId, dayRecord]: [string, any]) => {
                if (!dayRecord) return;
                result[zoneId] = {};
                Object.entries(dayRecord).forEach(([day, staffList]: [string, any]) => {
                    if (Array.isArray(staffList)) {
                        result[zoneId][day] = new Set(staffList);
                    }
                });
            });
            return result;
        } else {
            const result: any = {};
            Object.entries(data).forEach(([day, staffList]: [string, any]) => {
                if (Array.isArray(staffList)) {
                    result[day] = new Set(staffList);
                }
            });
            return result;
        }
    };

    const handleLoadTemplate = (data: any) => {
        if (templateModal.type === 'global') {
            setSelections(deserializeSelections(data, true));
        } else if (templateModal.type === 'zone' && templateModal.zoneId) {
            setSelections(prev => ({
                ...prev,
                [templateModal.zoneId!]: deserializeSelections(data, false)
            }));
        }
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        const zoneIdParam = searchParams.get('zoneId');
        const weekStartParam = searchParams.get('weekStart');
        const dayParam = searchParams.get('day');

        if (weekStartParam) {
            const [year, month, day] = weekStartParam.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                setWeekStartDate(date);
            }
        }

        if (zoneIdParam) {
            setExpandedZone(zoneIdParam);
        }

        if (dayParam) {
            const dayNum = parseInt(dayParam);
            if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
                setSelectedDay(dayNum);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadWeekHolidays();
        if (expandedZone) {
            loadExistingRoster(expandedZone);
        }
    }, [expandedZone, weekStartDate]);

    const loadWeekHolidays = async () => {
        try {
            const wDates = getWeekDates(weekStartDate);
            const startStr = wDates[0].fullDate.toLocaleDateString('en-CA');
            const endStr = wDates[6].fullDate.toLocaleDateString('en-CA');
            const data = await apiClient.get<any[]>(`/public-holidays/range?start=${startStr}&end=${endStr}&activeOnly=true`);
            setWeekHolidays(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load holidays', e);
        }
    };

    const loadExistingRoster = async (zoneId: string) => {
        try {
            const allRosters = await apiClient.get<any[]>(`/rosters?zoneId=${zoneId}&t=${Date.now()}`);
            const weekStartStr = weekStartDate.toISOString().split('T')[0];
            const roster = allRosters.find(r => r.weekStart.startsWith(weekStartStr));
            if (roster && Array.isArray(roster.assignments)) {
                const newAssignments: Record<number, Set<string>> = {};
                roster.assignments.forEach((a: any) => {
                    if (!newAssignments[a.dayOfWeek]) newAssignments[a.dayOfWeek] = new Set();
                    newAssignments[a.dayOfWeek].add(a.staffId);
                });
                setSelections(prev => ({ ...prev, [zoneId]: newAssignments }));

                if (roster.assignments[0]) {
                    setStartTime(roster.assignments[0].startTime || '07:00');
                    setFinishTime(roster.assignments[0].endTime || '17:00');
                    setLunchLength(roster.assignments[0].lunchLength || 30);
                }
            } else {
                setSelections(prev => ({ ...prev, [zoneId]: {} }));
            }
        } catch (e) {
            console.error('Failed to load existing roster:', e);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [zonesData, staffData] = await Promise.all([
                apiClient.get<Zone[]>(`/zones?t=${Date.now()}`),
                apiClient.get<Staff[]>(`/staff?t=${Date.now()}`),
            ]);
            setZones(Array.isArray(zonesData) ? zonesData : []);
            setAllStaff(Array.isArray(staffData) ? staffData : []);
        } catch (e) {
            setError('Failed to load data');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const getStaffForZone = (zoneId: string) => {
        if (!Array.isArray(allStaff)) return [];
        return allStaff.filter(s => s.zoneId === zoneId);
    };

    const toggleStaff = (zoneId: string, staffId: string) => {
        setSelections(prev => {
            const zoneSelections = prev[zoneId] || {};
            const daySelections = new Set(zoneSelections[selectedDay] || []);

            if (daySelections.has(staffId)) {
                daySelections.delete(staffId);
            } else {
                daySelections.add(staffId);
            }

            return {
                ...prev,
                [zoneId]: {
                    ...zoneSelections,
                    [selectedDay]: daySelections,
                },
            };
        });
    };

    const isStaffSelected = (zoneId: string, staffId: string) => {
        return selections[zoneId]?.[selectedDay]?.has(staffId) || false;
    };

    const getZoneSelectionCount = (zoneId: string) => {
        const zoneSelections = selections[zoneId] || {};
        return Object.values(zoneSelections).reduce((sum, set) => sum + set.size, 0);
    };

    const saveRoster = async (zoneId: string) => {
        const zoneSelections = selections[zoneId];
        if (!zoneSelections) return;

        const totalCount = Object.values(zoneSelections).reduce((sum, set) => sum + set.size, 0);
        if (totalCount === 0) {
            alert('Please select at least one staff member');
            return;
        }

        setIsSaving(true);
        try {
            // Use YYYY-MM-DD format to avoid timezone shifts
            const weekStart = weekStartDate.toLocaleDateString('en-CA');
            const roster = await apiClient.post<{ id: string }>('/rosters', {
                zoneId,
                weekStart: weekStart, // Backend now handles string correctly
            });

            const assignments: any[] = [];
            for (const [dayIndex, staffIds] of Object.entries(zoneSelections)) {
                for (const staffId of staffIds) {
                    assignments.push({
                        staffId,
                        dayOfWeek: parseInt(dayIndex),
                        shift: 'morning',
                        startTime,
                        endTime: finishTime,
                        lunchLength,
                    });
                }
            }

            await apiClient.post(`/rosters/${roster.id}/batch-assign`, { assignments });
            await apiClient.post(`/rosters/${roster.id}/publish`, {});

            alert(`Roster saved and published! ${totalCount} allocations created.`);
            setExpandedZone(null);
            loadExistingRoster(zoneId);
        } catch (e) {
            console.error(e);
            alert('Failed to save roster');
        } finally {
            setIsSaving(false);
        }
    };

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
                <button onClick={loadData} className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/rosters" className="p-2 rounded-lg hover:bg-white/5 transition">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Create / Edit Roster</h1>
                        <p className="text-caption">Select a zone and allocate staff for the week</p>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <label className="text-xs text-gray-400 mb-1">Week Starting</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent-gold)]" />
                        <input
                            type="date"
                            value={weekStartDate.toLocaleDateString('en-CA')}
                            onChange={(e) => {
                                // input[type=date] values are YYYY-MM-DD
                                const [year, month, day] = e.target.value.split('-').map(Number);
                                const date = new Date(year, month - 1, day); // Local midnight
                                if (!isNaN(date.getTime())) {
                                    const dow = date.getDay();
                                    const diff = (dow === 0 ? -6 : 1) - dow;
                                    date.setDate(date.getDate() + diff);
                                    date.setHours(0, 0, 0, 0);
                                    setWeekStartDate(date);
                                }
                            }}
                            className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg focus:ring-[var(--accent-gold)] focus:border-[var(--accent-gold)] block pl-10 p-2.5 [color-scheme:dark]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => openTemplateModal('global')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition text-gray-300 hover:text-white border border-white/10"
                >
                    <FileText className="w-4 h-4" />
                    Global Templates
                </button>
            </div>

            {(!Array.isArray(zones) || zones.length === 0) ? (
                <div className="card p-12 text-center">
                    <MapPin className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No Zones Yet</h2>
                    <p className="text-gray-500 mb-4">Create zones first to build rosters</p>
                    <Link
                        href="/zones"
                        className="inline-block px-4 py-2 rounded-lg font-medium"
                        style={{ background: 'var(--accent-gold)', color: '#000' }}
                    >
                        Create Zones
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {Array.isArray(zones) && zones.map(zone => {
                        const isExpanded = expandedZone === zone.id;
                        const zoneStaff = getStaffForZone(zone.id);
                        const selectionCount = getZoneSelectionCount(zone.id);
                        const zoneColor = zone.color || '#4CAF50';

                        return (
                            <div key={zone.id} className="card overflow-hidden">
                                <button
                                    onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: zoneColor + '20' }}
                                        >
                                            <MapPin className="w-6 h-6" style={{ color: zoneColor }} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-white">{zone.name}</p>
                                            <p className="text-caption">{zoneStaff.length} staff assigned</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openTemplateModal('zone', zone.id, zone.name);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                                            title="Zone Templates"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>

                                        {selectionCount > 0 && (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold"
                                                style={{ background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)' }}>
                                                {selectionCount} selected
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center justify-center gap-8 p-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                                            <div className="flex items-center gap-2">
                                                <Sunrise className="w-4 h-4 text-[var(--accent-gold)]" />
                                                <span className="text-xs text-gray-400">Start</span>
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="bg-transparent text-white font-medium border-none focus:ring-0 p-0 w-20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sunset className="w-4 h-4 text-[var(--accent-orange)]" />
                                                <span className="text-xs text-gray-400">Finish</span>
                                                <input
                                                    type="time"
                                                    value={finishTime}
                                                    onChange={(e) => setFinishTime(e.target.value)}
                                                    className="bg-transparent text-white font-medium border-none focus:ring-0 p-0 w-20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Coffee className="w-4 h-4 text-[var(--accent-blue)]" />
                                                <span className="text-xs text-gray-400">Lunch</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={lunchLength}
                                                        onChange={(e) => setLunchLength(parseInt(e.target.value) || 0)}
                                                        className="bg-transparent text-white font-medium border-none focus:ring-0 p-0 w-12 text-right"
                                                    />
                                                    <span className="text-white font-medium">min</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 p-4 overflow-x-auto">
                                            {weekDates.map((day, i) => {
                                                const isSelected = i === selectedDay;
                                                const dayCount = (selections[zone.id] && selections[zone.id][i]) ? selections[zone.id][i].size : 0;
                                                const dayDateStr = day.fullDate.toLocaleDateString('en-CA');
                                                const isHoliday = holidaySet.has(dayDateStr);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDay(i)}
                                                        className={`flex-1 min-w-[60px] py-3 px-2 rounded-lg text-center transition ${isSelected ? 'text-black font-medium' : 'hover:bg-white/5'}`}
                                                        style={{
                                                            background: isSelected ? 'var(--accent-gold)' : isHoliday ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                                            border: isHoliday && !isSelected ? '1px solid rgba(245, 158, 11, 0.4)' : 'none',
                                                        }}
                                                        title={isHoliday ? holidayNameMap.get(dayDateStr) : undefined}
                                                    >
                                                        <p className={`text-xs ${isSelected ? 'text-black/60' : isHoliday ? 'text-amber-400' : 'text-gray-500'}`}>{day.name}</p>
                                                        <p className={`text-lg font-medium ${isSelected ? '' : isHoliday ? 'text-amber-300' : 'text-white'}`}>{day.date}</p>
                                                        {dayCount > 0 && (
                                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${isSelected ? 'bg-black/20 text-black' : 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)]'}`}>
                                                                {dayCount}
                                                            </span>
                                                        )}
                                                        {isHoliday && (
                                                            <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: isSelected ? '#000' : '#f59e0b' }} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                                            {zoneStaff.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                                                    <p className="text-gray-500">No staff assigned to this zone</p>
                                                </div>
                                            ) : (
                                                zoneStaff.map(staff => {
                                                    const isChecked = isStaffSelected(zone.id, staff.id);
                                                    return (
                                                        <button
                                                            key={staff.id}
                                                            onClick={() => toggleStaff(zone.id, staff.id)}
                                                            className={`w-full flex items-center gap-4 p-3 rounded-lg transition ${isChecked ? '' : 'hover:bg-white/5'}`}
                                                            style={{
                                                                background: isChecked ? 'var(--accent-gold-bg)' : 'var(--bg-secondary)',
                                                                border: isChecked ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                                                            }}
                                                        >
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                                                style={{ background: isChecked ? 'var(--accent-gold)' : 'var(--bg-primary)' }}>
                                                                <span className={`text-sm font-bold ${isChecked ? 'text-black' : 'text-gray-400'}`}>
                                                                    {staff.firstName?.[0]}{staff.lastName?.[0]}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className="text-white font-medium">{staff.firstName} {staff.lastName}</p>
                                                                <p className="text-xs text-gray-400">{staff.startTime || '07:00'} - {staff.finishTime || '17:00'}</p>
                                                            </div>
                                                            {isChecked ? (
                                                                <Check className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-gray-600" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {zoneStaff.length > 0 && (
                                            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                <button
                                                    onClick={() => saveRoster(zone.id)}
                                                    disabled={isSaving || selectionCount === 0}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition disabled:opacity-50"
                                                    style={{ background: 'var(--accent-gold)', color: '#000' }}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Save className="w-5 h-5" />
                                                    )}
                                                    <span>{isSaving ? 'Saving...' : `Save / Update Roster (${selectionCount} allocations)`}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Leave Management Section */}
            {zones.length > 0 && (
                <div className="mt-8">
                    <LeaveManager
                        zones={zones}
                        allStaff={allStaff}
                        weekDates={weekDates}
                        weekStartDate={weekStartDate}
                    />
                </div>
            )
            }

            <TemplateModal
                isOpen={templateModal.isOpen}
                onClose={() => setTemplateModal(prev => ({ ...prev, isOpen: false }))}
                type={templateModal.type}
                zoneId={templateModal.zoneId}
                zoneName={templateModal.zoneName}
                currentData={
                    templateModal.type === 'global'
                        ? serializeSelections(selections, true)
                        : (templateModal.zoneId ? serializeSelections(selections[templateModal.zoneId] || {}, false) : {})
                }
                onLoad={handleLoadTemplate}
            />
        </div >
    );
}
