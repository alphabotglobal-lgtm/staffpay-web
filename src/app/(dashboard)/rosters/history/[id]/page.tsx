'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Loader2,
    AlertTriangle,
    User
} from 'lucide-react';
import { apiClient } from '../../../../../lib/api/client';

interface RosterAssignment {
    id: string;
    staffId: string;
    dayOfWeek: number; // 0=Sunday
    shift?: string;
    startTime?: string;
    endTime?: string;
    staff: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

interface Roster {
    id: string;
    zoneId: string;
    weekStart: string;
    status: string;
    zone: {
        id: string;
        name: string;
    };
    assignments: RosterAssignment[];
}

export default function RosterDetailsPage() {
    const params = useParams();
    const [roster, setRoster] = useState<Roster | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            loadRoster(params.id as string);
        }
    }, [params.id]);

    const loadRoster = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<Roster>(`/rosters/${id}`);
            setRoster(data);
        } catch (e) {
            setError('Failed to load roster details');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !roster) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle className="w-12 h-12 text-orange-500" />
                <p className="text-white">{error || 'Roster not found'}</p>
                <Link href="/rosters/history" className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium">
                    Back to History
                </Link>
            </div>
        );
    }

    // Organize Data for Grid
    // Rows: Staff
    // Cols: Days (Mon-Sun)
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Map 0(Sun) -> 6, 1(Mon) -> 0 ...
    const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

    const staffMap = new Map<string, { firstName: string, lastName: string, assignments: Record<number, RosterAssignment> }>();

    roster.assignments.forEach(a => {
        if (!staffMap.has(a.staffId)) {
            staffMap.set(a.staffId, {
                firstName: a.staff.firstName,
                lastName: a.staff.lastName,
                assignments: {}
            });
        }
        const dayIdx = dayMap[a.dayOfWeek];
        if (dayIdx !== undefined) {
            staffMap.get(a.staffId)!.assignments[dayIdx] = a;
        }
    });

    const staffList = Array.from(staffMap.values()).sort((a, b) => a.firstName.localeCompare(b.firstName));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rosters/history" className="p-2 rounded-lg hover:bg-white/5 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-white">Roster Details</h1>
                    <div className="flex items-center gap-4 text-caption mt-1">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--accent-gold)]" />
                            {roster.zone.name}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[var(--accent-blue)]" />
                            Week of {new Date(roster.weekStart).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 min-w-[200px] text-gray-400 font-medium text-sm">Staff Member</th>
                                {weekDays.map(d => (
                                    <th key={d} className="p-4 min-w-[100px] text-gray-400 font-medium text-center text-sm">{d}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No staff assigned in this roster.
                                    </td>
                                </tr>
                            ) : (
                                staffList.map((s, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/10 flex items-center justify-center text-[var(--accent-gold)]">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="text-white font-medium">{s.firstName} {s.lastName}</span>
                                            </div>
                                        </td>
                                        {weekDays.map((_, dayIdx) => {
                                            const assignment = s.assignments[dayIdx];
                                            return (
                                                <td key={dayIdx} className="p-4 text-center">
                                                    {assignment ? (
                                                        <div className="inline-block px-3 py-1 rounded bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs font-semibold border border-[var(--accent-gold)]/30">
                                                            P
                                                        </div>
                                                    ) : (
                                                        <span className="text-white/10">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
