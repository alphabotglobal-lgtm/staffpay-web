'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import StaffListModal from '@/components/StaffListModal';
import Link from 'next/link';
import {
    Users,
    UserCheck,
    UserX,
    Clock,

    TrendingUp,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    Loader2,
    X,
    Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ... (Keep existing interfaces)
interface DashboardStats {
    totalStaff: number;
    activeStaff: number;
    absentees: number;
    overtime: number;
    // Monthly/Weekly/Today Hours
    regularHoursMonth: number;
    overtimeHoursMonth: number;
    regularHoursWeek: number;
    overtimeHoursWeek: number;
    regularHoursToday: number;
    overtimeHoursToday: number;
}

interface Zone {
    id: string;
    name: string;
    description?: string;
    color?: string;
    staffCount?: number;
}

interface StaleShift {
    type: 'stale' | 'orphan';
    signIn?: any;
    signOut?: any;
    durationHours?: number;
    proposedTime: string;
}

function ZoneMetricsCard({ zoneStat }: { zoneStat: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const zoneColor = zoneStat.zoneColor || '#4CAF50';

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <div className="glass overflow-hidden transition-all duration-300 rounded-xl" style={{ borderColor: `${zoneColor}30` }}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex flex-col p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${zoneColor}20` }}>
                            <span style={{ color: zoneColor }} className="text-lg">📍</span>
                        </div>
                        <p className="font-semibold text-white">{zoneStat.zoneName || 'Unknown Zone'}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Metrics Row */}
                <div className="flex justify-around w-full">
                    <div className="text-center">
                        <p className="text-xl font-bold text-white">{zoneStat.totalStaff || 0}</p>
                        <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-green-500">{zoneStat.signedIn || 0}</p>
                        <p className="text-xs text-gray-400">In</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-blue-500">{zoneStat.absentees || 0}</p>
                        <p className="text-xs text-gray-400">Absent</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-red-500">{zoneStat.overtime || 0}</p>
                        <p className="text-xs text-gray-400">OT</p>
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5 space-y-4">
                    {/* Signed In */}
                    {zoneStat.signedInDetails?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-green-500 mb-2 tracking-wide">✓ SIGNED IN</p>
                            {zoneStat.signedInDetails.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-1 text-sm">
                                    <span className="text-white/70 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-green-500" />
                                        {s.name}
                                    </span>
                                    <span className="text-gray-400 text-xs">{formatTime(s.signInTime)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Absentees */}
                    {zoneStat.absenteeDetails?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-blue-500 mb-2 tracking-wide">⚠ ABSENTEES</p>
                            {zoneStat.absenteeDetails.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-1 text-sm">
                                    <span className="text-white/70 flex items-center gap-2">
                                        <UserX className="w-4 h-4 text-blue-500" />
                                        {s.name}
                                    </span>
                                    <span className="text-gray-400 text-xs">Expected {s.expectedTime}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Overtime */}
                    {zoneStat.overtimeDetails?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-red-500 mb-2 tracking-wide">⏰ OVERTIME</p>
                            {zoneStat.overtimeDetails.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-1 text-sm">
                                    <span className="text-white/70 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-red-500" />
                                        {s.name}
                                    </span>
                                    <span className="text-red-400 text-xs font-bold">+{s.overtimeHours} hrs</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!zoneStat.signedInDetails?.length && !zoneStat.absenteeDetails?.length && !zoneStat.overtimeDetails?.length && (
                        <p className="text-gray-500 text-sm italic">No activity today</p>
                    )}
                    {/* All Staff (if no activity or expanded explicitly) */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs font-bold text-gray-500 mb-2 tracking-wide">ALL ASSIGNED STAFF ({zoneStat.allStaffDetails?.length || 0})</p>
                        <div className="space-y-1">
                            {zoneStat.allStaffDetails?.map((s: any, i: number) => {
                                // Check status
                                const isSignedIn = zoneStat.signedInDetails?.some((x: any) => x.id === s.id);
                                const isAbsent = zoneStat.absenteeDetails?.some((x: any) => x.id === s.id);
                                const isOvertime = zoneStat.overtimeDetails?.some((x: any) => x.id === s.id);

                                let statusColor = "text-gray-500";
                                let statusIcon = null;

                                if (isSignedIn) { statusColor = "text-green-500"; statusIcon = <UserCheck className="w-3 h-3" />; }
                                else if (isAbsent) { statusColor = "text-blue-500"; statusIcon = <UserX className="w-3 h-3" />; }

                                return (
                                    <div key={i} className="flex items-center justify-between py-1 text-sm">
                                        <span className={`flex items-center gap-2 ${isSignedIn ? 'text-white' : 'text-gray-400'}`}>
                                            <div className="w-1 h-1 rounded-full bg-current" />
                                            {s.name}
                                        </span>
                                        <span className={`${statusColor} text-xs flex items-center gap-1`}>
                                            {statusIcon}
                                            {isSignedIn ? 'Working' : (isAbsent ? 'Absent' : 'Off')}
                                        </span>
                                    </div>
                                );
                            })}
                            {!zoneStat.allStaffDetails?.length && <p className="text-gray-600 text-xs italic">No staff assigned</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StaleShiftModal({ isOpen, onClose, staleShifts, onFix }: { isOpen: boolean, onClose: () => void, staleShifts: StaleShift[], onFix: (shift: StaleShift) => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] w-full max-w-2xl rounded-xl border border-red-500/30 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-red-500/10">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Manual Intervention Required</h3>
                            <p className="text-xs text-white/60">Identify and resolve missing sign-ins or sign-outs.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-4">
                    {staleShifts.map((shift, idx) => {
                        const isOrphan = shift.type === 'orphan';
                        const staff = isOrphan ? shift.signOut?.staff : shift.signIn?.staff;
                        const mainTime = isOrphan
                            ? new Date(shift.signOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(shift.signIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const propTime = new Date(shift.proposedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={idx} className="bg-black/30 rounded-lg p-4 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-500">
                                        {staff?.firstName?.[0] ?? '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">
                                            {staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown Staff'}
                                        </p>
                                        <div className="text-xs text-gray-400">
                                            {isOrphan ? (
                                                <p>Signed Out @ <span className="text-white">{mainTime}</span> <span className="mx-1">•</span> <span className="text-blue-400">No Sign-In found</span></p>
                                            ) : (
                                                <p>Signed In @ <span className="text-white">{mainTime}</span> <span className="mx-1">•</span> Duration: <span className="text-red-400">{Math.round(shift.durationHours || 0)}</span> hrs</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Proposed Fix</p>
                                        <p className="text-sm font-bold text-gold">
                                            {isOrphan ? `Sign In @ ${propTime}` : `Sign Out @ ${propTime}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onFix(shift)}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition"
                                    >
                                        FIX
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalStaff: 0,
        activeStaff: 0,
        absentees: 0,
        overtime: 0,
        regularHoursMonth: 0,
        overtimeHoursMonth: 0,
        regularHoursWeek: 0,
        overtimeHoursWeek: 0,
        regularHoursToday: 0,
        overtimeHoursToday: 0,
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    const [zones, setZones] = useState<Zone[]>([]);
    const [zoneStats, setZoneStats] = useState<any[]>([]);

    // Stale Shift State
    const [staleShifts, setStaleShifts] = useState<StaleShift[]>([]);
    const [isStaleModalOpen, setIsStaleModalOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalStaff, setModalStaff] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData(true);
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadDashboardData(false);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);

        // Helper to safely fetch data or return default
        const fetchData = async (endpoint: string, fallback: any) => {
            try {
                // apiClient.get throws on non-2xx
                return await apiClient.get(endpoint);
            } catch (e) {
                console.error(`Failed to load ${endpoint}`, e);
                return fallback;
            }
        };

        try {
            // Fetch Standard Data + Monthly/Weekly/Today Stats
            // Using apiClient ensures Authorization header is sent
            const [
                staffData,
                zonesData,
                signInsData,
                absenteesData,
                monthlyData,
                weeklyData,
                todayData,
                rosteredData,
                todayBreakdown
            ] = await Promise.all([
                fetchData('/staff', []),
                fetchData('/zones', []),
                fetchData('/sign-ins/today', []),
                fetchData('/sign-ins/absentees', []),
                fetchData('/sign-ins/stats?type=month', { regularHours: 0, overtimeHours: 0 }),
                fetchData('/sign-ins/stats?type=week', { regularHours: 0, overtimeHours: 0 }),
                fetchData('/sign-ins/stats?type=today', { regularHours: 0, overtimeHours: 0 }),
                fetchData('/sign-ins/rostered-today', []),
                fetchData('/sign-ins/breakdown?type=today', [])
            ]);

            setStats({
                totalStaff: Array.isArray(rosteredData) ? rosteredData.length : 0,
                activeStaff: calculateActiveStaff(Array.isArray(signInsData) ? signInsData : []),
                absentees: Array.isArray(absenteesData) ? absenteesData.length : 0,
                overtime: Array.isArray(todayBreakdown) ? todayBreakdown.filter((s: any) => s.overtimeHours > 0).length : 0,
                regularHoursMonth: monthlyData?.regularHours || 0,
                overtimeHoursMonth: monthlyData?.overtimeHours || 0,
                regularHoursWeek: weeklyData?.regularHours || 0,
                overtimeHoursWeek: weeklyData?.overtimeHours || 0,
                regularHoursToday: todayData?.regularHours || 0,
                overtimeHoursToday: todayData?.overtimeHours || 0,
            });
            setZones(Array.isArray(zonesData) ? zonesData : []);

            // Fetch Stale/Orphan Shifts
            const staleData = await fetchData('/sign-ins/flagged', []);
            setStaleShifts(staleData);

            // Fetch Zone Stats for Zone Overview
            const zoneStatsData = await fetchData('/sign-ins/zone-stats', []);
            setZoneStats(zoneStatsData);

        } catch (e) {
            setError('Failed to load dashboard data');
            console.error(e);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Helper to calculate active staff correctly from raw sign-in events
    const calculateActiveStaff = (events: any[]) => {
        const staffStatus: Record<string, string> = {};
        // Sort by time ascending
        const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        sorted.forEach(e => {
            staffStatus[e.staffId] = e.type; // 'in' or 'out'
        });

        return Object.values(staffStatus).filter(status => status === 'in').length;
    };

    const handleFixStaleShift = async (shift: StaleShift) => {
        try {
            const isOrphan = shift.type === 'orphan';
            const endpoint = isOrphan ? 'resolve-missing-in' : 'resolve-stale';
            const payload = isOrphan
                ? { staffId: shift.signOut.staffId, zoneId: shift.signOut.zoneId, timestamp: shift.proposedTime, signOutId: shift.signOut.id }
                : { staffId: shift.signIn.staffId, zoneId: shift.signIn.zoneId, timestamp: shift.proposedTime, signInId: shift.signIn.id };

            // W1-F6: Use apiClient with auth
            await apiClient.post(`/sign-ins/${endpoint}`, payload);

            // Refresh flagged shifts list
            try {
                const freshData = await apiClient.get<StaleShift[]>('/sign-ins/flagged');
                const shifts = Array.isArray(freshData) ? freshData : [];
                setStaleShifts(shifts);
                if (shifts.length === 0) setIsStaleModalOpen(false);
            } catch {
                // Fallback: remove locally
                setStaleShifts(prev => {
                    const updated = prev.filter(s => {
                        if (isOrphan) return s.signOut?.id !== shift.signOut.id;
                        return s.signIn?.id !== shift.signIn.id;
                    });
                    if (updated.length === 0) setIsStaleModalOpen(false);
                    return updated;
                });
            }
        } catch (e) {
            alert("Error fixing shift.");
        }
    };

    // Handle click on stat boxes - fetch appropriate data
    const handleStatClick = async (label: string) => {
        setModalTitle(label);
        try {
            let staff: any[] = [];

            if (label === 'Total Staff') {
                // Fetch rostered-today staff
                staff = await apiClient.get<any[]>('/sign-ins/rostered-today').catch(() => []);
                setModalStaff(staff.map((s: any) => ({
                    id: s.id,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
                    role: s.role || 'staff',
                    zone: s.zoneName || 'Unassigned',
                    status: 'active',
                    hours: `${s.startTime || '07:00'} - ${s.endTime || '16:00'}`,
                    photoUrl: s.facePhotoUrl || ''
                })));
            } else if (label === 'Signed In') {
                // Fetch currently signed-in staff
                const signIns = await apiClient.get<any[]>('/sign-ins/today').catch(() => []);

                // Get unique active staff (last event is 'in')
                const staffStatus: Record<string, any> = {};
                signIns.forEach((e: any) => {
                    staffStatus[e.staffId] = e;
                });

                const activeStaff = Object.values(staffStatus).filter((e: any) => e.type === 'in');
                setModalStaff(activeStaff.map((e: any) => ({
                    id: e.staffId,
                    name: `${e.staff?.firstName || ''} ${e.staff?.lastName || ''}`.trim() || 'Unknown',
                    role: e.staff?.role || 'staff',
                    zone: e.zone?.name || 'Unassigned',
                    status: 'active',
                    hours: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    photoUrl: e.staff?.facePhotoUrl || ''
                })));
            } else if (label === 'Overtime Today') {
                // Fetch today's breakdown, filter to overtime staff
                const breakdown = await apiClient.get<any[]>('/sign-ins/breakdown?type=today').catch(() => []);
                staff = breakdown.filter((s: any) => s.overtimeHours > 0);
                setModalStaff(staff.map((s: any) => ({
                    id: s.staffId,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
                    role: 'staff',
                    zone: '',
                    status: 'active',
                    hours: `${s.overtimeHours}h overtime`,
                    photoUrl: s.facePhotoUrl || ''
                })));
            } else if (label.toLowerCase().includes('absentee')) {
                // Fetch absentees (rostered but not signed in)
                staff = await apiClient.get<any[]>('/sign-ins/absentees').catch(() => []);
                setModalStaff(staff.map((s: any) => ({
                    id: s.id,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
                    role: s.role || 'staff',
                    zone: s.zoneName || 'Unassigned',
                    status: 'absent',
                    hours: s.rosteredShift || ''
                })));
            } else if (label.toLowerCase().includes('regular') || label.toLowerCase().includes('overtime')) {
                // Determine period from label (monthly/weekly)
                let type: 'today' | 'week' | 'month' = 'today';
                if (label.toLowerCase().includes('weekly')) type = 'week';
                if (label.toLowerCase().includes('monthly')) type = 'month';

                // Fetch breakdown with correct period
                const breakdown = await apiClient.get<any[]>(`/sign-ins/breakdown?type=${type}`).catch(() => []);

                // Filter based on type
                if (label.toLowerCase().includes('overtime')) {
                    staff = breakdown.filter((s: any) => s.overtimeHours > 0);
                } else {
                    staff = breakdown;
                }

                setModalStaff(staff.map((s: any) => ({
                    id: s.staffId,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
                    role: 'staff',
                    zone: '',
                    status: 'active',
                    hours: label.toLowerCase().includes('overtime')
                        ? `${s.overtimeHours}h overtime`
                        : `${s.regularHours}h reg / ${s.overtimeHours}h OT`,
                    photoUrl: s.facePhotoUrl || ''
                })));
            } else {
                // Default: fetch all staff
                staff = await apiClient.get<any[]>('/staff').catch(() => []);
                setModalStaff(staff.map((s: any) => ({
                    id: s.id,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
                    role: s.role || 'staff',
                    zone: s.zone?.name || 'Unassigned',
                    status: 'active',
                    hours: '',
                    photoUrl: s.facePhotoUrl || ''
                })));
            }
        } catch (e) {
            setModalStaff([]);
        }
        setIsModalOpen(true);
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const todayStats = [
        { icon: Users, label: 'Total Workforce', value: stats.totalStaff.toString(), color: 'blue' },
        { icon: UserCheck, label: 'Active Staff', value: stats.activeStaff.toString(), color: 'green' },
        { icon: UserX, label: 'Absentees Today', value: stats.absentees.toString(), color: 'orange' },
        { icon: Clock, label: 'Staff on Overtime', value: stats.overtime.toString(), color: 'red' },
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
                <button
                    onClick={() => loadDashboardData()}
                    className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium"
                >Retry</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Scrollable Top Section (Stats & Alerts) */}
            <div className="flex-shrink-0 space-y-6 mb-4">
                {/* STALE SHIFT ALERT */}
                {staleShifts.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between animate-pulse-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg animate-bounce">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">ATTENTION: {staleShifts.length} Shifts need Intervention</p>
                                <p className="text-red-400 text-sm">Staff have been signed in for over 12 hours. Please review.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsStaleModalOpen(true)}
                            className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 transition shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        >
                            REVIEW & FIX
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
                        <p className="text-caption">{currentDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/ai/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--accent-gold)' }}>
                            <Bot className="w-5 h-5" />
                            <span className="text-2xl font-semibold">AI Chat</span>
                        </Link>
                        <button onClick={() => loadDashboardData()} className="p-2 rounded-lg hover:bg-white/5 transition">
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                </div>

                {/* Hours Overview - all 4 in one row with section headers */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Month's Overview Section */}
                    <div className="glass p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Month&apos;s Overview</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleStatClick('Monthly Regular Hours')}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                                </div>
                                <div>
                                    <p className="text-caption">Regular Hours</p>
                                    <p className="stat-number-sm text-white">{stats.regularHoursMonth || 0}</p>
                                </div>
                            </div>
                            <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleStatClick('Monthly Overtime Hours')}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-red-bg)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--accent-red)' }} />
                                </div>
                                <div>
                                    <p className="text-caption">Overtime Hours</p>
                                    <p className="stat-number-sm text-red-400">{stats.overtimeHoursMonth || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Week's Overview Section */}
                    <div className="glass p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Week&apos;s Overview</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleStatClick('Weekly Regular Hours')}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue-bg)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                                </div>
                                <div>
                                    <p className="text-caption">Regular Hours</p>
                                    <p className="stat-number-sm text-white">{stats.regularHoursWeek || 0}</p>
                                </div>
                            </div>
                            <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleStatClick('Weekly Overtime Hours')}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-red-bg)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--accent-red)' }} />
                                </div>
                                <div>
                                    <p className="text-caption">Overtime Hours</p>
                                    <p className="stat-number-sm text-red-400">{stats.overtimeHoursWeek || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today's Overview (4 stat cards: Regular, Overtime, Total, Absent) */}
                <div className="glass-glow p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white tracking-tight">Today&apos;s Overview</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-500 font-medium uppercase tracking-wider">Live System</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition bounce-hover" onClick={() => handleStatClick('Total Staff')}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5" style={{ background: 'var(--accent-blue-bg)' }}>
                                <Users className="w-full h-full" style={{ color: 'var(--accent-blue)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Total Staff</p>
                                <p className="text-2xl font-bold text-white">{stats.totalStaff}</p>
                            </div>
                        </div>
                        <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition bounce-hover" onClick={() => handleStatClick('Signed In')}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5" style={{ background: 'var(--accent-green-bg)' }}>
                                <UserCheck className="w-full h-full" style={{ color: 'var(--accent-green)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Signed In</p>
                                <p className="text-2xl font-bold text-green-400">{stats.activeStaff}</p>
                            </div>
                        </div>
                        <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition bounce-hover" onClick={() => handleStatClick('Absentees Today')}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5" style={{ background: 'var(--accent-orange-bg)' }}>
                                <UserX className="w-full h-full" style={{ color: 'var(--accent-orange)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Absentees</p>
                                <p className="text-2xl font-bold text-orange-400">{stats.absentees}</p>
                            </div>
                        </div>
                        <div className="stat-card glass flex items-center gap-4 cursor-pointer hover:bg-white/5 transition bounce-hover" onClick={() => handleStatClick('Overtime Today')}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5" style={{ background: 'var(--accent-red-bg)' }}>
                                <Clock className="w-full h-full" style={{ color: 'var(--accent-red)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Overtime</p>
                                <p className="text-2xl font-bold text-red-400">{stats.overtime}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Zone Overview */}
            <div className="flex-1 overflow-hidden flex flex-col glass p-6 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex-shrink-0 flex items-center justify-between mb-4">
                    <h2 className="text-h2 text-white">Zone Overview</h2>
                    <Link href="/zones" className="flex items-center gap-1 text-caption hover:text-white transition" style={{ color: 'var(--accent-gold)' }}>
                        Manage Zones <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {zoneStats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No zones configured</p>
                            <Link href="/zones" className="text-gold hover:underline mt-2 inline-block">Create your first zone</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4 pb-4">
                            {zoneStats.map((zoneStat: any) => <ZoneMetricsCard key={zoneStat.zoneId} zoneStat={zoneStat} />)}
                        </div>
                    )}
                </div>
            </div>

            <StaffListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                staff={modalStaff}
            />

            <StaleShiftModal
                isOpen={isStaleModalOpen}
                onClose={() => setIsStaleModalOpen(false)}
                staleShifts={staleShifts}
                onFix={handleFixStaleShift}
            />
        </div>
    );
}

// Styles
const styles = `
            @keyframes pulse-border {
                0 % { box- shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% {box - shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% {box - shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
            .animate-pulse-border {
                animation: pulse-border 2s infinite;
}
            `;
