'use client';

import { useState } from 'react';
import { UserPlus, ScanFace, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistryPage() {
    const router = useRouter();

    const handleCreateStaff = () => {
        router.push('/staff/create');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Registry Mode</h1>
                <p className="text-gray-500">Manage staff check-ins and profiles</p>
            </div>

            {/* Create Staff Profile Button */}
            <div
                onClick={handleCreateStaff}
                className="p-6 bg-gradient-to-r from-primary to-primary/70 rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center">
                        <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-black">CREATE STAFF PROFILE</h2>
                        <p className="text-sm text-black/70">Register new employee with face scan</p>
                    </div>
                    <div className="text-black/70">→</div>
                </div>
            </div>

            {/* Start Face Scan Button */}
            <div className="p-6 bg-dark-800 border-2 border-blue-500/30 rounded-2xl cursor-pointer hover:border-blue-500/50 transition">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500/15 rounded-2xl flex items-center justify-center">
                        <ScanFace className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-white">START FACE SCAN</h2>
                        <p className="text-sm text-gray-400">Sign in / Sign out with timelock</p>
                    </div>
                    <div className="text-blue-500">→</div>
                </div>
            </div>

            {/* Empty State for Overview */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Today's Overview</h2>
                    <span className="text-sm text-primary">Clean Slate</span>
                </div>
                <div className="p-12 bg-dark-800 rounded-2xl border border-dark-600 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">No activity data yet</p>
                    <p className="text-sm text-gray-600 mt-2">Stats will appear here once staff start signing in</p>
                </div>
            </div>

            {/* Empty State for Recent Scans */}
            <div>
                <h2 className="text-xl font-bold mb-4">Recent Scans</h2>
                <div className="p-12 bg-dark-800 rounded-2xl border border-dark-600 text-center">
                    <ScanFace className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">No recent scan activity</p>
                    <p className="text-sm text-gray-600 mt-2">Recent sign-ins and sign-outs will appear here</p>
                </div>
            </div>
        </div>
    );
}
