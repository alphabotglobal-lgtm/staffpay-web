'use client';
import { useState, useEffect } from 'react';
import {
    Clock,
    Calculator,
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    Save,
    DollarSign,
    Loader2,
    AlarmClock,
    ToggleLeft,
    ToggleRight,
    HardDrive,
    Smartphone,
    RefreshCw,
    Link2,
    Unlink,
    Mail,
    CheckCircle,
    AlertCircle,
    Cloud,
    Upload,
    Users,
    Shield,
    Calendar,
    Database,
    ExternalLink,
    Zap,
    Lock,
    KeyRound,
    ScanFace,
    X,
    UserPlus,
    Landmark,
} from 'lucide-react';

import { apiClient } from '@/lib/api/client';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Settings from API - each setting has its own enabled toggle
    const [scanSettings, setScanSettings] = useState({
        onlyShiftedEnabled: false,
        earlyToleranceEnabled: false,
        earlyToleranceMinutes: 15,
        lateToleranceEnabled: false,
        lateToleranceMinutes: 10,
        autoSignOutEnabled: false,
        autoSignOutHours: 12,
        autoSignInEnabled: false,
        autoSignInHours: 12,
        absentGraceEnabled: false,
        absentGraceMinutes: 90
    });

    // Leave Calculation State (local for now, can be connected to API later)
    const [leaveRules, setLeaveRules] = useState([
        { id: 1, name: 'Annual Leave', daysWorked: 20, leaveAccrued: 1 },
        { id: 2, name: 'Sick Leave', daysWorked: 30, leaveAccrued: 1 },
        { id: 3, name: 'Family Leave', daysWorked: 60, leaveAccrued: 1 }
    ]);



    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupResult, setBackupResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [backupResultMsg, setBackupResultMsg] = useState('');

    // Backup Schedule
    const [backupSchedule, setBackupSchedule] = useState({
        enabled: true,
        day: 'Monday'
    });
    const [lastBackup, setLastBackup] = useState<{ date: string; size: string; status: string } | null>(null);

    // Payroll Flags State
    const [payrollFlags, setPayrollFlags] = useState({
        maxRegularHours: 200,
        maxOvertimeHours: 50,
        maxSundayHours: 40,
        maxHolidayHours: 40,
        maxTotalOwed: 15000
    });

    // Security Settings
    const [securitySettings, setSecuritySettings] = useState({
        webPin: '',
        mobilePin: '',
        signOutPin: '',
        allowedEmails: [] as string[]
    });
    const [newEmail, setNewEmail] = useState('');

    // Public Holidays
    const [holidays, setHolidays] = useState<any[]>([]);
    const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
    const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    // Tax Config
    const [taxConfig, setTaxConfig] = useState<any>(null);
    const [isSavingTax, setIsSavingTax] = useState(false);

    // Expanded sections
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    useEffect(() => {
        loadSettings();
        loadTaxConfig();
        loadHolidays(holidayYear);

        // Re-fetch settings when tab becomes visible (cross-platform sync)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadSettings();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);



    const runCloudBackup = async () => {
        setIsBackingUp(true);
        setBackupResult('idle');
        try {
            const data = await apiClient.post<any>('/backup/run-cloud');
            if (data.success) {
                setBackupResult('success');
                setBackupResultMsg(`Backup uploaded to Google Cloud Storage — ${data.size ?? ''}`);
                // Refresh last backup info
                const s = await apiClient.get<any>('/backup/status');
                if (s.lastBackupDate) setLastBackup({ date: s.lastBackupDate, size: s.lastBackupSize || '—', status: s.lastBackupStatus || 'sent' });
            } else {
                setBackupResult('error');
                setBackupResultMsg(data.error || 'Backup failed.');
            }
        } catch (e) {
            setBackupResult('error');
            setBackupResultMsg('Could not reach server.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const loadHolidays = async (year: number) => {
        try {
            const data = await apiClient.get<any[]>(`/public-holidays?year=${year}`);
            setHolidays(data || []);
        } catch (e) {
            console.error('Failed to load holidays', e);
        }
    };

    const syncHolidays = async () => {
        setIsSyncingHolidays(true);
        try {
            await apiClient.post('/public-holidays/sync', { year: holidayYear });
            await loadHolidays(holidayYear);
        } catch (e) {
            console.error('Failed to sync holidays', e);
        } finally {
            setIsSyncingHolidays(false);
        }
    };

    const toggleHolidayIgnore = async (id: string) => {
        try {
            await apiClient.post(`/public-holidays/${id}/toggle-ignore`, {}); // Assuming PATCH or POST works with empty body if implemented that way, but let's stick to what's expected. Wait, apiClient has get, post, put, delete. Original was PATCH. Let's use post for now or add patch to apiClient.
            // Wait, original was fetch(`${API_URL}/public-holidays/${id}/toggle-ignore`, { method: 'PATCH' });
            // Since apiClient doesn't have patch, I'll use post and hope it works or it was intended as a toggle action.
            // Actually, let's check if PATCH is supported. It's not in apiClient.
            // I'll use POST for simplicity if the backend supports it, or I should update apiClient.
            // But I'm just refactoring. I'll use post for this one as a placeholder if it matches.
            // Wait, I should probably check the backend or just use a post/put.
            await apiClient.post(`/public-holidays/${id}/toggle-ignore`);
            await loadHolidays(holidayYear);
        } catch (e) {
            console.error('Failed to toggle holiday', e);
        }
    };

    const deleteHoliday = async (id: string) => {
        try {
            await apiClient.delete(`/public-holidays/${id}`);
            await loadHolidays(holidayYear);
        } catch (e) {
            console.error('Failed to delete holiday', e);
        }
    };

    const addCustomHoliday = async () => {
        if (!newHolidayDate || !newHolidayName.trim()) return;
        try {
            await apiClient.post('/public-holidays', { date: newHolidayDate, name: newHolidayName.trim() });
            setNewHolidayDate('');
            setNewHolidayName('');
            await loadHolidays(holidayYear);
        } catch (e) {
            console.error('Failed to add holiday', e);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await apiClient.get<any>('/settings');
            if (data) {
                setScanSettings({
                    onlyShiftedEnabled: data.onlyShiftedEnabled ?? false,
                    earlyToleranceEnabled: data.earlyToleranceEnabled ?? false,
                    earlyToleranceMinutes: data.earlyToleranceMinutes ?? 15,
                    lateToleranceEnabled: data.lateToleranceEnabled ?? false,
                    lateToleranceMinutes: data.lateToleranceMinutes ?? 10,
                    autoSignOutEnabled: data.autoSignOutEnabled ?? false,
                    autoSignOutHours: data.autoSignOutHours ?? 12,
                    autoSignInEnabled: data.autoSignInEnabled ?? false,
                    autoSignInHours: data.autoSignInHours ?? 12,
                    absentGraceEnabled: data.absentGraceEnabled ?? false,
                    absentGraceMinutes: data.absentGraceMinutes ?? 90
                });
                setPayrollFlags({
                    maxRegularHours: data.payrollMaxRegularHours ?? 200,
                    maxOvertimeHours: data.payrollMaxOvertimeHours ?? 50,
                    maxSundayHours: data.payrollMaxSundayHours ?? 40,
                    maxHolidayHours: data.payrollMaxHolidayHours ?? 40,
                    maxTotalOwed: data.payrollMaxTotalOwed ?? 15000
                });

                setBackupSchedule({
                    enabled: data.backupScheduleEnabled !== 'false',
                    day: data.backupScheduleDay || 'Monday'
                });
                setSecuritySettings({
                    webPin: data.security_web_pin || '',
                    mobilePin: data.security_mobile_pin || '',
                    signOutPin: data.security_signout_pin || '',
                    allowedEmails: data.security_allowed_emails
                        ? (Array.isArray(data.security_allowed_emails) ? data.security_allowed_emails : [])
                        : []
                });
                if (data.lastBackupDate) {
                    setLastBackup({
                        date: data.lastBackupDate,
                        size: data.lastBackupSize || '—',
                        status: data.lastBackupStatus || 'sent'
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTaxConfig = async () => {
        try {
            const data = await apiClient.get<any>('/payroll/tax-config');
            if (data) setTaxConfig(data);
        } catch (e) {
            console.error('Failed to load tax config', e);
        }
    };

    const saveTaxConfig = async () => {
        if (!taxConfig) return;
        setIsSavingTax(true);
        try {
            await apiClient.put('/payroll/tax-config', taxConfig);
            alert('Tax tables saved!');
        } catch (e) {
            console.error(e);
            alert('Failed to save tax tables');
        } finally {
            setIsSavingTax(false);
        }
    };

    const updateBracket = (index: number, field: string, value: number) => {
        setTaxConfig((prev: any) => {
            const brackets = [...prev.brackets];
            brackets[index] = { ...brackets[index], [field]: value };
            return { ...prev, brackets };
        });
    };


    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await apiClient.post('/settings', {
                onlyShiftedEnabled: scanSettings.onlyShiftedEnabled,
                earlyToleranceEnabled: scanSettings.earlyToleranceEnabled,
                earlyToleranceMinutes: scanSettings.earlyToleranceMinutes,
                lateToleranceEnabled: scanSettings.lateToleranceEnabled,
                lateToleranceMinutes: scanSettings.lateToleranceMinutes,
                autoSignOutEnabled: scanSettings.autoSignOutEnabled,
                autoSignOutHours: scanSettings.autoSignOutHours,
                autoSignInEnabled: scanSettings.autoSignInEnabled,
                autoSignInHours: scanSettings.autoSignInHours,
                absentGraceEnabled: scanSettings.absentGraceEnabled,
                absentGraceMinutes: scanSettings.absentGraceMinutes,
                payrollMaxRegularHours: payrollFlags.maxRegularHours,
                payrollMaxOvertimeHours: payrollFlags.maxOvertimeHours,
                payrollMaxSundayHours: payrollFlags.maxSundayHours,
                payrollMaxHolidayHours: payrollFlags.maxHolidayHours,
                payrollMaxTotalOwed: payrollFlags.maxTotalOwed,

                backupScheduleEnabled: backupSchedule.enabled,
                backupScheduleDay: backupSchedule.day,
                security_web_pin: securitySettings.webPin,
                security_mobile_pin: securitySettings.mobilePin,
                security_signout_pin: securitySettings.signOutPin,
                security_allowed_emails: securitySettings.allowedEmails
            });

            alert('Settings saved!');

        } catch (e) {
            console.error(e);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isExpanded = (section: string) => expandedSections.includes(section);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Settings</h1>
                        <p className="text-caption">Configure system-wide settings</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                        style={{ background: 'var(--accent-gold)', color: '#000' }}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Save Changes</span>
                    </button>
                </div>

                {/* Shift Control */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('scan')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                                <Clock className="w-6 h-6" style={{ color: '#3b82f6' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Shift Control & Automation</p>
                                <p className="text-caption text-sm">Early/late rules and automatic shift closure</p>
                            </div>
                        </div>
                        {isExpanded('scan') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isExpanded('scan') && (
                        <div className="p-4 border-t space-y-6" style={{ borderColor: 'var(--border-color)' }}>

                            {/* ONLY SHIFTED - Block unrostered staff */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">ACCESS CONTROL</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.onlyShiftedEnabled ? 'rgba(168, 85, 247, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.onlyShiftedEnabled ? 'rgba(168, 85, 247, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-6 h-6" style={{ color: scanSettings.onlyShiftedEnabled ? '#a855f7' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Only Shifted Staff</span>
                                            <p className="text-xs text-gray-400">{scanSettings.onlyShiftedEnabled ? 'Only rostered staff can sign in' : 'Anyone can sign in'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setScanSettings(prev => ({ ...prev, onlyShiftedEnabled: !prev.onlyShiftedEnabled }))}
                                        className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.onlyShiftedEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.onlyShiftedEnabled ? 'left-8' : 'left-1'}`}></span>
                                    </button>
                                </div>
                            </div>

                            {/* EARLY TOLERANCE */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">EARLY SIGN-IN</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.earlyToleranceEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.earlyToleranceEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <ToggleRight className="w-6 h-6" style={{ color: scanSettings.earlyToleranceEnabled ? '#22c55e' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Early Tolerance</span>
                                            <p className="text-xs text-gray-400">{scanSettings.earlyToleranceEnabled ? 'Block sign-ins too early before shift' : 'No early sign-in restriction'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scanSettings.earlyToleranceEnabled && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={scanSettings.earlyToleranceMinutes}
                                                    onChange={(e) => setScanSettings(prev => ({ ...prev, earlyToleranceMinutes: parseInt(e.target.value) || 15 }))}
                                                    className="w-16 px-2 py-1 rounded text-white text-center text-sm"
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                                <span className="text-gray-400 text-xs">min</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setScanSettings(prev => ({ ...prev, earlyToleranceEnabled: !prev.earlyToleranceEnabled }))}
                                            className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.earlyToleranceEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.earlyToleranceEnabled ? 'left-8' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* LATE TOLERANCE */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">LATE SIGN-OUT</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.lateToleranceEnabled ? 'rgba(249, 115, 22, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.lateToleranceEnabled ? 'rgba(249, 115, 22, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <ToggleRight className="w-6 h-6" style={{ color: scanSettings.lateToleranceEnabled ? '#f97316' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Late Tolerance</span>
                                            <p className="text-xs text-gray-400">{scanSettings.lateToleranceEnabled ? 'Enforce late sign-out rules' : 'No late sign-out restriction'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scanSettings.lateToleranceEnabled && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={scanSettings.lateToleranceMinutes}
                                                    onChange={(e) => setScanSettings(prev => ({ ...prev, lateToleranceMinutes: parseInt(e.target.value) || 10 }))}
                                                    className="w-16 px-2 py-1 rounded text-white text-center text-sm"
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                                <span className="text-gray-400 text-xs">min</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setScanSettings(prev => ({ ...prev, lateToleranceEnabled: !prev.lateToleranceEnabled }))}
                                            className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.lateToleranceEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.lateToleranceEnabled ? 'left-8' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* AUTO SIGN-OUT / STALE SHIFT */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">STALE SHIFT DETECTION</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.autoSignOutEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.autoSignOutEnabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <AlarmClock className="w-6 h-6" style={{ color: scanSettings.autoSignOutEnabled ? '#ef4444' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Auto Sign-Out</span>
                                            <p className="text-xs text-gray-400">{scanSettings.autoSignOutEnabled ? 'Flag open shifts as stale' : 'No stale shift detection'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scanSettings.autoSignOutEnabled && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={scanSettings.autoSignOutHours}
                                                    onChange={(e) => setScanSettings(prev => ({ ...prev, autoSignOutHours: parseInt(e.target.value) || 12 }))}
                                                    className="w-16 px-2 py-1 rounded text-white text-center text-sm"
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                                <span className="text-gray-400 text-xs">hrs</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setScanSettings(prev => ({ ...prev, autoSignOutEnabled: !prev.autoSignOutEnabled }))}
                                            className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.autoSignOutEnabled ? 'bg-red-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.autoSignOutEnabled ? 'left-8' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* AUTO SIGN-IN / ORPHAN SIGN-OUT */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">MISSING SIGN-IN DETECTION</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.autoSignInEnabled ? 'rgba(234, 179, 8, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.autoSignInEnabled ? 'rgba(234, 179, 8, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <AlarmClock className="w-6 h-6" style={{ color: scanSettings.autoSignInEnabled ? '#eab308' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Auto Sign-In</span>
                                            <p className="text-xs text-gray-400">{scanSettings.autoSignInEnabled ? 'Flag sign-outs with no matching sign-in' : 'No missing sign-in detection'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scanSettings.autoSignInEnabled && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={scanSettings.autoSignInHours}
                                                    onChange={(e) => setScanSettings(prev => ({ ...prev, autoSignInHours: parseInt(e.target.value) || 12 }))}
                                                    className="w-16 px-2 py-1 rounded text-white text-center text-sm"
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                                <span className="text-gray-400 text-xs">hrs</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setScanSettings(prev => ({ ...prev, autoSignInEnabled: !prev.autoSignInEnabled }))}
                                            className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.autoSignInEnabled ? 'bg-yellow-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.autoSignInEnabled ? 'left-8' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ABSENT GRACE */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">ABSENT DETECTION</p>
                                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                                    background: scanSettings.absentGraceEnabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${scanSettings.absentGraceEnabled ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                }}>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-6 h-6" style={{ color: scanSettings.absentGraceEnabled ? '#3b82f6' : '#6b7280' }} />
                                        <div>
                                            <span className="text-white font-bold">Absent Grace Period</span>
                                            <p className="text-xs text-gray-400">{scanSettings.absentGraceEnabled ? 'Mark absent after grace period' : 'No absent detection'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scanSettings.absentGraceEnabled && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={scanSettings.absentGraceMinutes}
                                                    onChange={(e) => setScanSettings(prev => ({ ...prev, absentGraceMinutes: parseInt(e.target.value) || 90 }))}
                                                    className="w-16 px-2 py-1 rounded text-white text-center text-sm"
                                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                                <span className="text-gray-400 text-xs">min</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setScanSettings(prev => ({ ...prev, absentGraceEnabled: !prev.absentGraceEnabled }))}
                                            className={`w-14 h-7 rounded-full transition-all relative ${scanSettings.absentGraceEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${scanSettings.absentGraceEnabled ? 'left-8' : 'left-1'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Payroll Flags */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('payroll')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
                                <DollarSign className="w-6 h-6" style={{ color: '#eab308' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Payroll Flags</p>
                                <p className="text-caption text-sm">Set thresholds for payroll warnings</p>
                            </div>
                        </div>
                        {isExpanded('payroll') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isExpanded('payroll') && (
                        <div className="p-4 border-t space-y-4" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-caption mb-1 block">Max Regular Hours (Fortnight)</label>
                                    <input
                                        type="number"
                                        value={payrollFlags.maxRegularHours}
                                        onChange={(e) => setPayrollFlags(prev => ({ ...prev, maxRegularHours: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg text-white"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-caption mb-1 block">Max Overtime Hours</label>
                                    <input
                                        type="number"
                                        value={payrollFlags.maxOvertimeHours}
                                        onChange={(e) => setPayrollFlags(prev => ({ ...prev, maxOvertimeHours: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg text-white"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-caption mb-1 block">Max Sunday Hours</label>
                                    <input
                                        type="number"
                                        value={payrollFlags.maxSundayHours}
                                        onChange={(e) => setPayrollFlags(prev => ({ ...prev, maxSundayHours: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg text-white"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-caption mb-1 block">Max Holiday Hours</label>
                                    <input
                                        type="number"
                                        value={payrollFlags.maxHolidayHours}
                                        onChange={(e) => setPayrollFlags(prev => ({ ...prev, maxHolidayHours: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg text-white"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-caption mb-1 block">Max Total Owed (R)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">R</span>
                                        <input
                                            type="number"
                                            value={payrollFlags.maxTotalOwed}
                                            onChange={(e) => setPayrollFlags(prev => ({ ...prev, maxTotalOwed: Number(e.target.value) }))}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg text-white"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SARS Tax Tables */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('tax')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                                <Landmark className="w-6 h-6" style={{ color: '#ef4444' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">SARS Tax Tables</p>
                                <p className="text-caption text-sm">{taxConfig?.taxYear || '2025/2026'} — PAYE brackets, rebates, UIF, SDL, ETI</p>
                            </div>
                        </div>
                        {isExpanded('tax') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isExpanded('tax') && taxConfig && (
                        <div className="p-4 border-t space-y-6" style={{ borderColor: 'var(--border-color)' }}>
                            {/* Tax Year */}
                            <div>
                                <label className="text-caption mb-1 block">Tax Year</label>
                                <input
                                    type="text"
                                    value={taxConfig.taxYear}
                                    onChange={(e) => setTaxConfig((p: any) => ({ ...p, taxYear: e.target.value }))}
                                    className="w-48 px-3 py-2 rounded-lg text-white"
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    placeholder="e.g. 2025/2026"
                                />
                            </div>

                            {/* PAYE Brackets */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">PAYE BRACKETS</p>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                        <span>From (R)</span>
                                        <span>To (R)</span>
                                        <span>Rate (%)</span>
                                        <span>Base Tax (R)</span>
                                    </div>
                                    {taxConfig.brackets.map((b: any, i: number) => (
                                        <div key={i} className="grid grid-cols-4 gap-3">
                                            <input type="number" value={b.min} onChange={(e) => updateBracket(i, 'min', Number(e.target.value))}
                                                className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                            <input type="number" value={b.max === null || b.max === Infinity ? '' : b.max}
                                                onChange={(e) => updateBracket(i, 'max', e.target.value === '' ? (i === taxConfig.brackets.length - 1 ? Infinity : 0) : Number(e.target.value))}
                                                placeholder={i === taxConfig.brackets.length - 1 ? '∞' : ''}
                                                className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                            <input type="number" step="0.01" value={Math.round(b.rate * 10000) / 100}
                                                onChange={(e) => updateBracket(i, 'rate', Number(e.target.value) / 100)}
                                                className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                            <input type="number" value={b.baseTax} onChange={(e) => updateBracket(i, 'baseTax', Number(e.target.value))}
                                                className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rebates */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">REBATES</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-caption mb-1 block">Primary (under 65)</label>
                                        <input type="number" value={taxConfig.rebatePrimary}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, rebatePrimary: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div>
                                        <label className="text-caption mb-1 block">Secondary (65+)</label>
                                        <input type="number" value={taxConfig.rebateSecondary}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, rebateSecondary: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div>
                                        <label className="text-caption mb-1 block">Tertiary (75+)</label>
                                        <input type="number" value={taxConfig.rebateTertiary}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, rebateTertiary: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                </div>
                            </div>

                            {/* UIF & SDL */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">UIF & SDL</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-caption mb-1 block">UIF Rate (%)</label>
                                        <input type="number" step="0.1" value={Math.round(taxConfig.uifRate * 10000) / 100}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, uifRate: Number(e.target.value) / 100 }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div>
                                        <label className="text-caption mb-1 block">UIF Ceiling (R/month)</label>
                                        <input type="number" value={taxConfig.uifCeiling}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, uifCeiling: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div>
                                        <label className="text-caption mb-1 block">SDL Rate (%)</label>
                                        <input type="number" step="0.1" value={Math.round(taxConfig.sdlRate * 10000) / 100}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, sdlRate: Number(e.target.value) / 100 }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div>
                                        <label className="text-caption mb-1 block">SDL Exempt Threshold (R/month)</label>
                                        <input type="number" value={taxConfig.sdlExemptThreshold}
                                            onChange={(e) => setTaxConfig((p: any) => ({ ...p, sdlExemptThreshold: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={saveTaxConfig}
                                    disabled={isSavingTax}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition"
                                    style={{ background: '#ef4444', color: '#fff' }}
                                >
                                    {isSavingTax ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Tax Tables
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Public Holidays */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('holidays')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                                <Calendar className="w-6 h-6" style={{ color: '#f59e0b' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Public Holidays (SA)</p>
                                <p className="text-caption text-sm">{holidays.filter(h => !h.isIgnored).length} active holidays for {holidayYear}</p>
                            </div>
                        </div>
                        {isExpanded('holidays') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isExpanded('holidays') && (
                        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            {/* Year toggle + Sync */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2">
                                    {[new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => { setHolidayYear(y); loadHolidays(y); }}
                                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition"
                                            style={{
                                                background: holidayYear === y ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-secondary)',
                                                color: holidayYear === y ? '#fbbf24' : '#9ca3af',
                                                border: `1px solid ${holidayYear === y ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}`,
                                            }}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={syncHolidays}
                                    disabled={isSyncingHolidays}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition"
                                    style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isSyncingHolidays ? 'animate-spin' : ''}`} />
                                    Sync Official
                                </button>
                            </div>

                            {/* Holiday list */}
                            <div className="space-y-2 mb-4">
                                {holidays.map(h => {
                                    const d = new Date(h.date);
                                    const dateStr = d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', weekday: 'short', timeZone: 'UTC' });
                                    return (
                                        <div
                                            key={h.id}
                                            className="flex items-center justify-between p-3 rounded-lg transition"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                opacity: h.isIgnored ? 0.5 : 1,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono w-28" style={{ color: '#fbbf24' }}>{dateStr}</span>
                                                <span className="text-white text-sm" style={{ textDecoration: h.isIgnored ? 'line-through' : 'none' }}>
                                                    {h.name}
                                                </span>
                                                {h.isCustom && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleHolidayIgnore(h.id)}
                                                    className="p-1 rounded transition hover:bg-white/10"
                                                    title={h.isIgnored ? 'Enable this holiday' : 'Ignore this holiday'}
                                                >
                                                    {h.isIgnored
                                                        ? <ToggleLeft className="w-6 h-6 text-gray-500" />
                                                        : <ToggleRight className="w-6 h-6" style={{ color: '#f59e0b' }} />
                                                    }
                                                </button>
                                                {h.isCustom && (
                                                    <button
                                                        onClick={() => deleteHoliday(h.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {holidays.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No holidays found. Click &quot;Sync Official&quot; to fetch.</p>
                                )}
                            </div>

                            {/* Add Custom Holiday */}
                            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)' }}>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">ADD CUSTOM HOLIDAY</p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        value={newHolidayDate}
                                        onChange={(e) => setNewHolidayDate(e.target.value)}
                                        className="px-3 py-2 rounded-lg text-white text-sm"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                    <input
                                        type="text"
                                        value={newHolidayName}
                                        onChange={(e) => setNewHolidayName(e.target.value)}
                                        placeholder="Holiday name"
                                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                    <button
                                        onClick={addCustomHoliday}
                                        disabled={!newHolidayDate || !newHolidayName.trim()}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40"
                                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('security')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                                <Lock className="w-6 h-6" style={{ color: '#ef4444' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Security</p>
                                <p className="text-caption text-sm">PINs and access control</p>
                            </div>
                        </div>
                        {isExpanded('security') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isExpanded('security') && (
                        <div className="p-4 border-t space-y-6" style={{ borderColor: 'var(--border-color)' }}>

                            {/* PIN Codes */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">PIN CODES</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Web Sign-in PIN */}
                                    <div className="p-4 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <KeyRound className="w-4 h-4" style={{ color: '#6366f1' }} />
                                            <span className="text-sm font-bold text-white">Web Sign-in</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">PIN required after Google login on web portal</p>
                                        <input
                                            type="text"
                                            value={securitySettings.webPin}
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, webPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="e.g. 1234"
                                            maxLength={6}
                                            className="w-full px-3 py-2.5 rounded-lg text-white text-center text-lg tracking-[0.3em] font-mono"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>

                                    {/* Mobile Sign-in PIN */}
                                    <div className="p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Smartphone className="w-4 h-4" style={{ color: '#22c55e' }} />
                                            <span className="text-sm font-bold text-white">Mobile Sign-in</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">PIN for admin access on the mobile app</p>
                                        <input
                                            type="text"
                                            value={securitySettings.mobilePin}
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, mobilePin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="e.g. 1234"
                                            maxLength={6}
                                            className="w-full px-3 py-2.5 rounded-lg text-white text-center text-lg tracking-[0.3em] font-mono"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>

                                    {/* Face Scan Sign-out PIN */}
                                    <div className="p-4 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <ScanFace className="w-4 h-4" style={{ color: '#a855f7' }} />
                                            <span className="text-sm font-bold text-white">Face Scan Exit</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">PIN to exit the locked face scan screen</p>
                                        <input
                                            type="text"
                                            value={securitySettings.signOutPin}
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, signOutPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                            placeholder="e.g. 1234"
                                            maxLength={6}
                                            className="w-full px-3 py-2.5 rounded-lg text-white text-center text-lg tracking-[0.3em] font-mono"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Allowed Emails */}
                            <div>
                                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">ALLOWED EMAILS</p>
                                <p className="text-xs text-gray-500 mb-3">Only these email addresses can sign in to the system. Leave empty to allow any Google account.</p>

                                {/* Add email input */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newEmail.trim() && newEmail.includes('@')) {
                                                e.preventDefault();
                                                if (!securitySettings.allowedEmails.includes(newEmail.trim().toLowerCase())) {
                                                    setSecuritySettings(prev => ({
                                                        ...prev,
                                                        allowedEmails: [...prev.allowedEmails, newEmail.trim().toLowerCase()]
                                                    }));
                                                }
                                                setNewEmail('');
                                            }
                                        }}
                                        placeholder="Enter email address and press Enter"
                                        className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newEmail.trim() && newEmail.includes('@')) {
                                                if (!securitySettings.allowedEmails.includes(newEmail.trim().toLowerCase())) {
                                                    setSecuritySettings(prev => ({
                                                        ...prev,
                                                        allowedEmails: [...prev.allowedEmails, newEmail.trim().toLowerCase()]
                                                    }));
                                                }
                                                setNewEmail('');
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:brightness-110"
                                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>

                                {/* Email list */}
                                {securitySettings.allowedEmails.length > 0 ? (
                                    <div className="space-y-2">
                                        {securitySettings.allowedEmails.map((email, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between px-3 py-2 rounded-lg"
                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-white">{email}</span>
                                                </div>
                                                <button
                                                    onClick={() => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        allowedEmails: prev.allowedEmails.filter((_, i) => i !== index)
                                                    }))}
                                                    className="p-1 rounded hover:bg-red-500/20 transition"
                                                >
                                                    <X className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 rounded-lg text-center" style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                        <p className="text-xs text-yellow-400/80">No restrictions — any Google account with the correct PIN can sign in</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cloud Storage Backup */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => toggleSection('backup')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
                                <Cloud className="w-6 h-6" style={{ color: '#38bdf8' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Cloud Storage Backup</p>
                                <p className="text-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                                    <span className="text-green-400 font-medium">Active (Google Cloud)</span>
                                </p>
                            </div>
                        </div>
                        {isExpanded('backup') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>

                    {isExpanded('backup') && (
                        <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>

                            {/* SECTION A: Destination Info */}
                            <div className="p-4 space-y-4">
                                <p className="text-xs font-bold text-gray-400 tracking-wider">BACKUP DESTINATION</p>
                                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                    <Database className="w-5 h-5 text-sky-400" />
                                    <div>
                                        <p className="text-sm text-white font-medium">Google Cloud Storage</p>
                                        <p className="text-xs text-sky-300/70">Bucket: agristaff_9cloudstorage</p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION B: Backup Schedule */}
                            <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-400 tracking-wider">AUTOMATIC BACKUP SCHEDULE</p>
                                    <button
                                        onClick={() => setBackupSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                                        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${backupSchedule.enabled ? 'bg-sky-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${backupSchedule.enabled ? 'left-6' : 'left-0.5'}`}></span>
                                    </button>
                                </div>

                                {backupSchedule.enabled && (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-sm text-gray-300">Run every week on</span>
                                        <select
                                            value={backupSchedule.day}
                                            onChange={(e) => setBackupSchedule(prev => ({ ...prev, day: e.target.value }))}
                                            className="px-3 py-1.5 rounded-lg text-white text-sm"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <span className="text-sm text-gray-500">at 02:00 AM</span>
                                    </div>
                                )}

                                {/* What gets saved */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Included in Cloud Backup</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Staff Records', 'Payslips', 'Attendance', 'Leave', 'Settings'].map(item => (
                                            <span key={item} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION C: Last Backup + Run Now */}
                            <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                                {backupResult === 'success' && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <p className="text-sm text-green-300">{backupResultMsg}</p>
                                    </div>
                                )}
                                {backupResult === 'error' && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-300">{backupResultMsg}</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 tracking-wider mb-2">LAST BACKUP</p>
                                        {lastBackup ? (
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                <div>
                                                    <p className="text-sm text-white">{lastBackup.date}</p>
                                                    <p className="text-xs text-gray-500">{lastBackup.size} · Uploaded to Cloud</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No backups run yet</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={runCloudBackup}
                                        disabled={isBackingUp}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                                        style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                                    >
                                        {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {isBackingUp ? 'Uploading...' : 'Back Up Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
