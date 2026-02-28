'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    Plus,
    Users,
    Clock,
    ChevronLeft,
    ChevronRight,
    History,
    MapPin,
    Loader2,
    AlertTriangle,
    Coffee
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';

interface Zone {
    id: string;
    name: string;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
}

interface Assignment {
    id: string;
    staffId: string;
    dayOfWeek: number;
    staff: Staff;
    startTime?: string;
    endTime?: string;
    lunchLength?: number;
}

interface Roster {
    id: string;
    zoneId: string;
    zone: Zone;
    weekStart: string;
    assignments: Assignment[];
}

const getWeekDates = (baseDate: Date) => {
    const date = new Date(baseDate);
    const day = date.getDay();
    // Monday = 1, Sunday = 0. We want Monday to be 1, so we shift Sunday.
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date.setDate(date.getDate() + diff));
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
};

export default function RostersPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [zones, setZones] = useState<Zone[]>([]);
    const [rosters, setRosters] = useState<Roster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
    const [weekHolidays, setWeekHolidays] = useState<any[]>([]);

    const weekDates = getWeekDates(selectedDate);
    const weekStartStr = weekDates[0].toLocaleDateString('en-CA'); // YYYY-MM-DD

    useEffect(() => {
        loadData();
    }, [weekStartStr]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const weekStartQuery = weekDates[0].toLocaleDateString('en-CA');
            const weekEndQuery = weekDates[6].toLocaleDateString('en-CA');
            const [zonesData, rostersData, holidaysData] = await Promise.all([
                apiClient.get<Zone[]>(`/zones?t=${Date.now()}`),
                apiClient.get<Roster[]>(`/rosters?weekStart=${weekStartQuery}&t=${Date.now()}`),
                apiClient.get<any[]>(`/public-holidays/range?start=${weekStartQuery}&end=${weekEndQuery}&activeOnly=true`),
            ]);

            setZones(Array.isArray(zonesData) ? zonesData : []);
            setRosters(Array.isArray(rostersData) ? rostersData : []);
            setWeekHolidays(Array.isArray(holidaysData) ? holidaysData : []);

            // Auto-expand all zones by default initially
            const initialExpanded: Record<string, boolean> = {};
            if (Array.isArray(zonesData)) {
                zonesData.forEach(z => {
                    initialExpanded[z.id] = true;
                });
            }
            setExpandedZones(prev => ({ ...initialExpanded, ...prev }));
        } catch (e) {
            setError('Failed to load roster data');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleZone = (zoneId: string) => {
        setExpandedZones(prev => ({
            ...prev,
            [zoneId]: !prev[zoneId]
        }));
    };

    const totalAssigned = Array.isArray(rosters) ? rosters.reduce((acc, r) => acc + (Array.isArray(r.assignments) ? r.assignments.length : 0), 0) : 0;
    const holidayMap = new Map(weekHolidays.map((h: any) => [h.date.split('T')[0], h.name]));

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
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Staff Roster</h1>
                        <p className="text-caption">Manage weekly staff assignments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/rosters/history"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-400 hover:text-white"
                            style={{ border: '1px solid var(--border-color)' }}
                        >
                            <History className="w-5 h-5" />
                            <span>Past Rosters</span>
                        </Link>
                        <Link
                            href="/rosters/create"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                            style={{ background: 'var(--accent-gold)', color: '#000' }}
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create / Edit Roster</span>
                        </Link>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() - 7);
                                setSelectedDate(newDate);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                            <span className="font-medium text-white">
                                Week of {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() + 7);
                                setSelectedDate(newDate);
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {weekDates.map((date, i) => {
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dateStr = date.toLocaleDateString('en-CA');
                            const isHoliday = holidayMap.has(dateStr);
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex-1 py-3 px-2 rounded-lg text-center transition ${isSelected ? 'text-black font-medium' : 'hover:bg-white/5'}`}
                                    style={{
                                        background: isSelected ? 'var(--accent-gold)' : isHoliday ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                        border: isToday && !isSelected ? '1px solid var(--accent-gold)' : isHoliday && !isSelected ? '1px solid rgba(245, 158, 11, 0.4)' : 'none'
                                    }}
                                    title={isHoliday ? holidayMap.get(dateStr) : undefined}
                                >
                                    <p className={`text-xs ${isSelected ? 'text-black/60' : isHoliday ? 'text-amber-400' : 'text-gray-500'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className={`text-lg font-medium ${isSelected ? '' : isHoliday ? 'text-amber-300' : 'text-white'}`}>
                                        {date.getDate()}
                                    </p>
                                    {isHoliday && (
                                        <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: isSelected ? '#000' : '#f59e0b' }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Public Holiday Banner */}
                {weekHolidays.length > 0 && (
                    <div className="card p-4" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5" style={{ color: '#f59e0b' }} />
                            <span className="font-medium text-amber-400 text-sm">Public Holidays This Week</span>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {weekHolidays.map((h: any) => (
                                    <span key={h.id} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                                        {new Date(h.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', weekday: 'short', timeZone: 'UTC' })} — {h.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                            <Users className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Total Weekly Allocations</p>
                            <p className="stat-number-sm text-white">{totalAssigned}</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gold-bg)' }}>
                            <Clock className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Zones Active</p>
                            <p className="stat-number-sm text-white">{Array.isArray(rosters) ? rosters.length : 0}</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-orange-bg)' }}>
                            <MapPin className="w-6 h-6" style={{ color: 'var(--accent-orange)' }} />
                        </div>
                        <div>
                            <p className="text-caption">Current Day Assigned</p>
                            <p className="stat-number-sm text-white">
                                {Array.isArray(rosters) ? rosters.reduce((acc, r) => acc + (Array.isArray(r.assignments) ? r.assignments.filter(a => a.dayOfWeek === (selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1)).length : 0), 0) : 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Roster by Zone Grid */}
                {(!Array.isArray(zones) || zones.length === 0) ? (
                    <div className="card p-8 text-center">
                        <MapPin className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-white font-medium mb-2">No zones created yet</h3>
                        <p className="text-gray-500 mb-4">Create zones first to manage rosters</p>
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
                        {Array.isArray(zones) && zones.map((zone) => {
                            const roster = Array.isArray(rosters) ? rosters.find(r => r.zoneId === zone.id) : null;
                            const isExpanded = expandedZones[zone.id] !== false;

                            // Group assignments by staff for the grid
                            const staffMap: Record<string, { staff: Staff; assignedDays: Set<number> }> = {};
                            roster?.assignments?.forEach(a => {
                                if (!staffMap[a.staffId]) {
                                    staffMap[a.staffId] = { staff: a.staff, assignedDays: new Set() };
                                }
                                staffMap[a.staffId].assignedDays.add(a.dayOfWeek);
                            });

                            return (
                                <div key={zone.id} className="card overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
                                        onClick={() => toggleZone(zone.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-gold-bg)' }}>
                                                <MapPin className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-medium text-white">{zone.name}</h3>
                                                    <Link
                                                        href={`/rosters/create?zoneId=${zone.id}&weekStart=${weekStartStr}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] hover:bg-gold hover:text-obsidian transition"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Staff
                                                    </Link>
                                                </div>
                                                <p className="text-caption">
                                                    {roster ? `${Object.keys(staffMap).length} staff assigned this week` : 'No staff assigned yet'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Roster Times */}
                                            {roster && roster.assignments?.[0] && (
                                                <div className="flex items-center gap-4 text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                                                        <span className="text-xs font-medium text-gray-300">
                                                            {roster.assignments[0].startTime || '07:00'} - {roster.assignments[0].endTime || '17:00'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Coffee className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                                                        <span className="text-xs font-medium text-gray-300">
                                                            {roster.assignments[0].lunchLength ?? 30}m
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <div className="hidden md:flex gap-1">
                                                    {weekDates.map((_, i) => {
                                                        const dailyCount = roster?.assignments?.filter(a => a.dayOfWeek === i).length || 0;
                                                        return (
                                                            <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-[10px] border border-white/10" style={{ background: dailyCount > 0 ? 'var(--accent-gold-bg)' : 'transparent', color: dailyCount > 0 ? 'var(--accent-gold)' : 'gray' }}>
                                                                {dailyCount}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/5">
                                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[200px]">Staff Member</th>
                                                        {weekDates.map((date, i) => {
                                                            const dStr = date.toLocaleDateString('en-CA');
                                                            const isHol = holidayMap.has(dStr);
                                                            return (
                                                                <th key={i}
                                                                    className="p-4 text-xs font-medium uppercase tracking-wider text-center"
                                                                    style={{
                                                                        color: isHol ? '#fbbf24' : '#9ca3af',
                                                                        background: isHol ? 'rgba(245, 158, 11, 0.06)' : undefined,
                                                                    }}
                                                                    title={isHol ? holidayMap.get(dStr) : undefined}
                                                                >
                                                                    <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                                    <div className="text-[10px] mt-0.5">{date.getDate()}</div>
                                                                    {isHol && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: '#f59e0b' }} />}
                                                                </th>
                                                            );
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {Object.values(staffMap).map(({ staff, assignedDays }) => (
                                                        <tr key={staff.id} className="hover:bg-white/5 transition">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                                        <span className="text-xs font-medium">
                                                                            {staff.firstName?.[0]}{staff.lastName?.[0]}
                                                                        </span>
                                                                    </div>
                                                                    <Link
                                                                        href={`/staff/${staff.id}`}
                                                                        className="text-sm font-medium text-white hover:text-gold transition"
                                                                    >
                                                                        {staff.firstName} {staff.lastName}
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                            {weekDates.map((_, i) => {
                                                                const isAssigned = assignedDays.has(i);
                                                                return (
                                                                    <td key={i} className="p-4 text-center">
                                                                        <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition ${isAssigned ? 'bg-gold border-gold text-obsidian' : 'border-white/10'}`}>
                                                                            {isAssigned && (
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </div>
        </div>
    );
}
