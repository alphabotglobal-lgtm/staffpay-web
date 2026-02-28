'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    ArrowLeft,
    Clock,
    MapPin,
    Loader2,
    AlertTriangle,
    ChevronRight,
    Search
} from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';

interface Zone {
    id: string;
    name: string;
}

interface RosterAssignment {
    id: string;
    staffId: string;
    staff?: {
        firstName: string;
        lastName: string;
    };
}

interface Roster {
    id: string;
    zoneId: string;
    weekStart: string;
    status: string;
    zone: Zone;
    assignments: RosterAssignment[];
}

export default function RosterHistoryPage() {
    const [rosters, setRosters] = useState<Roster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRosters();
    }, []);

    const loadRosters = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<Roster[]>(`/rosters?t=${Date.now()}`);
            setRosters(data);
        } catch (e) {
            setError('Failed to load roster history');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Group rosters by week start date
    const rostersByWeek: Record<string, Roster[]> = {};
    rosters.forEach(r => {
        const date = new Date(r.weekStart).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        if (!rostersByWeek[date]) rostersByWeek[date] = [];
        rostersByWeek[date].push(r);
    });

    const filteredWeeks = Object.entries(rostersByWeek).filter(([week, weekRosters]) => {
        if (!searchTerm) return true;
        return week.toLowerCase().includes(searchTerm.toLowerCase()) ||
            weekRosters.some(r => r.zone.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }).sort((a, b) => new Date(b[1][0].weekStart).getTime() - new Date(a[1][0].weekStart).getTime());

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rosters" className="p-2 rounded-lg hover:bg-white/5 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-white">Roster History</h1>
                    <p className="text-caption">View and manage past staff assignments</p>
                </div>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by zone or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)] transition"
                    />
                </div>
            </div>

            {error ? (
                <div className="card p-8 text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 mx-auto text-orange-500" />
                    <p className="text-white">{error}</p>
                    <button onClick={loadRosters} className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium">
                        Retry
                    </button>
                </div>
            ) : filteredWeeks.length === 0 ? (
                <div className="card p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No Rosters Found</h2>
                    <p className="text-gray-500">History will appear here once you create and save rosters.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredWeeks.map(([weekDate, weekRosters]) => (
                        <div key={weekDate} className="space-y-3">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[var(--accent-gold)]" />
                                Week of {weekDate}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {weekRosters.map((roster) => (
                                    <Link href={`/rosters/history/${roster.id}`} key={roster.id} className="block">
                                        <div className="card p-4 flex items-center justify-between hover:bg-white/5 transition cursor-pointer group border border-transparent hover:border-[var(--accent-gold)]/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent-gold-bg)] text-[var(--accent-gold)]">
                                                    <MapPin className="w-6 h-6" />
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-white">{roster.zone.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Clock className="w-3 h-3 text-[var(--accent-blue)]" />
                                                            {roster.assignments.length} assignments
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roster.status === 'published'
                                                            ? 'bg-[var(--accent-green-bg)] text-[var(--accent-green)]'
                                                            : 'bg-orange-500/10 text-orange-500'
                                                            }`}>
                                                            {roster.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
