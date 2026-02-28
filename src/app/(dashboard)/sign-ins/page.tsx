'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { signInsApi, SignIn } from '../../../lib/api/signins';

export default function SignInsPage() {
    const [signIns, setSignIns] = useState<SignIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'overtime'>('all');

    useEffect(() => {
        loadSignIns();
    }, [filter]);

    const loadSignIns = async () => {
        try {
            setLoading(true);
            let data;
            if (filter === 'active') {
                data = await signInsApi.getActive();
            } else if (filter === 'overtime') {
                data = await signInsApi.getOvertime();
            } else {
                data = await signInsApi.getAll();
            }
            setSignIns(data);
        } catch (error) {
            console.error('Failed to load sign-ins:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sign-Ins & Sign-Outs</h1>
                    <p className="text-gray-500">Track staff attendance and hours</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl transition ${filter === 'all'
                        ? 'bg-primary text-black'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                        }`}
                >
                    All Records
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-xl transition ${filter === 'active'
                        ? 'bg-primary text-black'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                        }`}
                >
                    Currently Signed In
                </button>
                <button
                    onClick={() => setFilter('overtime')}
                    className={`px-4 py-2 rounded-xl transition ${filter === 'overtime'
                        ? 'bg-primary text-black'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                        }`}
                >
                    Overtime
                </button>
            </div>

            {/* Sign-Ins Table */}
            <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-dark-600">
                            <th className="text-left p-4 text-gray-500 font-medium">Staff Member</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Zone</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Sign In</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Sign Out</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Regular Hours</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Overtime</th>
                            <th className="text-left p-4 text-gray-500 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {signIns.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    No sign-in records found
                                </td>
                            </tr>
                        ) : (
                            signIns.map((signIn) => (
                                <tr key={signIn.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition">
                                    <td className="p-4">
                                        <div>
                                            <Link
                                                href={`/staff/${signIn.staffId}`}
                                                className="font-medium hover:text-primary transition cursor-pointer"
                                            >
                                                {signIn.staff?.firstName} {signIn.staff?.lastName}
                                            </Link>
                                            <p className="text-sm text-gray-500">{formatDate(signIn.signInTime)}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-gray-400">{signIn.zone?.name || 'N/A'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-primary font-medium">{formatTime(signIn.signInTime)}</span>
                                    </td>
                                    <td className="p-4">
                                        {signIn.signOutTime ? (
                                            <span className="text-gray-400">{formatTime(signIn.signOutTime)}</span>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white">{(signIn.regularHours || 0).toFixed(1)}h</span>
                                    </td>
                                    <td className="p-4">
                                        {(signIn.overtimeHours || 0) > 0 ? (
                                            <span className="text-orange-400 font-medium">{(signIn.overtimeHours || 0).toFixed(1)}h</span>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {!signIn.signOutTime ? (
                                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                                Active
                                            </span>
                                        ) : signIn.isTimelocked ? (
                                            <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-medium">
                                                Locked
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-500/20 text-gray-500 rounded-full text-xs font-medium">
                                                Completed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                    <p className="text-sm text-gray-500">Total Records</p>
                    <p className="text-2xl font-bold text-primary">{signIns.length}</p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                    <p className="text-sm text-gray-500">Currently Active</p>
                    <p className="text-2xl font-bold text-primary">
                        {signIns.filter(s => !s.signOutTime).length}
                    </p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                    <p className="text-sm text-gray-500">Total Regular Hours</p>
                    <p className="text-2xl font-bold text-white">
                        {signIns.reduce((sum, s) => sum + (s.regularHours || 0), 0).toFixed(1)}h
                    </p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                    <p className="text-sm text-gray-500">Total Overtime</p>
                    <p className="text-2xl font-bold text-orange-400">
                        {signIns.reduce((sum, s) => sum + (s.overtimeHours || 0), 0).toFixed(1)}h
                    </p>
                </div>
            </div>
        </div>
    );
}
