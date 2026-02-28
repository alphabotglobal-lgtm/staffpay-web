'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, History, Clock, Users, Calendar, Loader2 } from 'lucide-react';
import { DataManagementService } from '@/services/DataManagementService';
import { apiClient } from '@/lib/api/client';

export default function BulkManagementPage() {
    const [zones, setZones] = useState<any[]>([]);
    const [payGroups, setPayGroups] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedPayGroup, setSelectedPayGroup] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                const [zRes, pgRes] = await Promise.all([
                    apiClient.get<any[]>('/zones'),
                    apiClient.get<any[]>('/pay-groups')
                ]);
                setZones(Array.isArray(zRes) ? zRes : []);
                setPayGroups(Array.isArray(pgRes) ? pgRes : []);
            } catch (e) {
                console.error('Failed to load filters', e);
                setFetchError('Failed to load filter data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleExport = (type: any) => {
        const url = DataManagementService.getExportUrl(type, {
            zoneId: selectedZone,
            payGroupId: selectedPayGroup
        });
        window.open(url, '_blank');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);
        setError(null);

        try {
            const result = await DataManagementService.importStaff(file);
            setImportResult(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-white font-medium">{fetchError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gold text-obsidian rounded-lg font-medium transition hover:scale-105"
                >
                    Refresh Hub
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-8 max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Bulk Actions</h1>
                        <p className="text-gray-400 mt-1">Manage all your staff data efficiently through professional Excel tools.</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                        style={{ border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
                        onClick={() => window.open(DataManagementService.getTemplateUrl(), '_blank')}
                    >
                        <Download className="w-4 h-4" />
                        Download Import Template
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Export Center */}
                    <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                            <History className="w-5 h-5 text-blue-400" />
                            Export Center
                        </h2>

                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Zone Filter</label>
                                    <select
                                        className="w-full bg-black/40 border-none text-white rounded-lg p-2 focus:ring-1 focus:ring-[var(--accent-gold)]"
                                        value={selectedZone}
                                        onChange={(e) => setSelectedZone(e.target.value)}
                                    >
                                        <option value="">All Zones</option>
                                        {Array.isArray(zones) && zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Pay Group Filter</label>
                                    <select
                                        className="w-full bg-black/40 border-none text-white rounded-lg p-2 focus:ring-1 focus:ring-[var(--accent-gold)]"
                                        value={selectedPayGroup}
                                        onChange={(e) => setSelectedPayGroup(e.target.value)}
                                    >
                                        <option value="">All Groups</option>
                                        {Array.isArray(payGroups) && payGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ExportButton icon={<Users />} label="Staff Profiles" onClick={() => handleExport('staff')} color="emerald" />
                                <ExportButton icon={<Calendar />} label="Leave History" onClick={() => handleExport('leave')} color="amber" />
                                <ExportButton icon={<History />} label="Payroll History" onClick={() => handleExport('payroll')} color="blue" />
                                <ExportButton icon={<Clock />} label="Login Logs" onClick={() => handleExport('logins')} color="purple" />
                                <ExportButton icon={<FileSpreadsheet />} label="Shift History" onClick={() => handleExport('shifts')} color="indigo" />
                            </div>
                        </div>
                    </div>

                    {/* Import Center */}
                    <div className="p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                            <Upload className="w-5 h-5 text-[var(--accent-gold)]" />
                            Bulk Employee Import
                        </h2>

                        <div className="space-y-6">
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Add hundreds of employees at once. Fill out our template with profile details,
                                <span className="text-[var(--accent-gold)] font-semibold"> bank info, and leave credits</span>.
                            </p>

                            {/* Upload Zone */}
                            <label className={`
              flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all
              ${isImporting ? 'opacity-50' : 'hover:bg-white/[0.05]'}
            `} style={{ borderColor: 'rgba(var(--accent-gold-rgb), 0.2)', background: 'rgba(255,255,255,0.02)' }}>
                                <Upload className={`w-12 h-12 mb-4 ${isImporting ? 'animate-bounce text-gray-500' : 'text-[var(--accent-gold)]'}`} />
                                <span className="text-white font-medium">{isImporting ? 'Processing Data...' : 'Drop Excel file here or click'}</span>
                                <span className="text-gray-500 text-sm mt-1">Accepts .xlsx and .csv</span>
                                <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleImport} disabled={isImporting} />
                            </label>

                            {/* Results Display */}
                            {error && (
                                <div className="flex gap-3 p-4 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {importResult && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl text-[var(--accent-gold)]" style={{ background: 'var(--accent-gold-bg)', border: '1px solid rgba(var(--accent-gold-rgb), 0.2)' }}>
                                        <CheckCircle2 className="w-6 h-6" />
                                        <span className="font-bold">{importResult.success} Employees Imported Successfully!</span>
                                    </div>

                                    {importResult.errors.length > 0 && (
                                        <div className="p-4 rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Import Issues ({importResult.errors.length})</h4>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {importResult.errors.map((err, i) => (
                                                    <div key={i} className="text-xs text-red-400 flex gap-2">
                                                        <span>•</span> {err}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExportButton({ icon, label, onClick, color }: any) {
    const colors: any = {
        emerald: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10',
        amber: 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10',
        blue: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10',
        purple: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
        indigo: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10',
    };

    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-3 px-4 py-4 rounded-xl border transition-all text-sm font-medium
        bg-white/5 ${colors[color]} 
      `}
        >
            <span className="w-5 h-5 opacity-80">{icon}</span>
            {label}
        </button>
    );
}
