'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, User, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Intervention {
    id: string;
    staffId: string;
    zoneId?: string;
    type?: string;
    interventionType?: 'sign_in_correction' | 'manual_log';
    details?: string;
    timestamp: string;
    isAutoSignedOut?: boolean;
    isAutoSignedIn?: boolean;
    staff: { firstName: string; lastName: string; employeeCode: string };
    zone?: { name: string };
}

export default function InterventionsCard() {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchInterventions = async () => {
            try {
                const res = await fetch(`${API_URL}/sign-ins/interventions`);
                if (res.ok) {
                    const data = await res.json();
                    setInterventions(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error('Failed to fetch interventions', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInterventions();
    }, []);

    if (isLoading) {
        return (
            <div className="card p-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
        );
    }

    if (interventions.length === 0) return null;

    return (
        <div className="card overflow-hidden">
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-medium">Manual Shift Interventions</h2>
                        <p className="text-caption">Historical corrections to sign-in/out data</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                        <span className="text-xs font-bold text-orange-400">{interventions.length} LOGGED</span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 border-t border-white/10">
                    {interventions.map((item) => {
                        const date = new Date(item.timestamp);
                        const formattedDate = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
                        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition group">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[50px]">
                                        <p className="text-xs font-bold text-gray-500 uppercase">{formattedDate}</p>
                                        <p className="text-lg font-black text-white">{formattedTime}</p>
                                    </div>

                                    <div className="h-8 w-px bg-white/10" />

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">{item.staff.firstName} {item.staff.lastName}</p>
                                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{item.staff.employeeCode}</span>
                                        </div>
                                        {item.interventionType === 'manual_log' ? (
                                            <p className="text-xs text-orange-400 mt-1">{item.details}</p>
                                        ) : (
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                                    <MapPin className="w-3 h-3" />
                                                    {item.zone?.name || 'Unknown'}
                                                </div>
                                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${item.isAutoSignedOut ? 'text-red-400' : 'text-blue-400'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    {item.isAutoSignedOut ? 'Auto Signed Out' : 'Auto Signed In'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white transition" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
