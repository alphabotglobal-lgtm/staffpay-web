'use client';
import { useState, useEffect } from 'react';
import {
    Calendar,
    UserCheck,
    UserX,
    Clock,
    Plus,
    X,
    Check,
    AlertTriangle,
    ChevronDown,
    Loader2,
    RefreshCw
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface LeaveRequest {
    id: string;
    staffId: string;
    staff: {
        firstName: string;
        lastName: string;
        facePhotoUrl?: string;
    };
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    doctorNoteUrl?: string;
    status: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
}

interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    annualLeaveBalance?: number;
    sickLeaveBalance?: number;
}

export default function LeavePage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);

    // New request form state
    const [newRequest, setNewRequest] = useState({
        staffId: '',
        type: 'annual',
        startDate: '',
        endDate: '',
        days: 1,
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leaveRes, staffRes] = await Promise.all([
                fetch(`${API_URL}/leave`),
                fetch(`${API_URL}/staff`)
            ]);
            if (leaveRes.ok) setRequests(await leaveRes.json());
            if (staffRes.ok) setStaff(await staffRes.json());
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            const res = await fetch(`${API_URL}/leave/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy: 'admin' })
            });
            if (res.ok) {
                await loadData();
                // Open the detail view for the approved request so admin can fill in details
                const approved = requests.find(r => r.id === id) || (await res.json());
                if (approved) {
                    setDetailRequest({ ...approved, status: 'approved' });
                }
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        }
        setProcessing(null);
    };

    const handleReject = async (id: string) => {
        setProcessing(id);
        try {
            const res = await fetch(`${API_URL}/leave/${id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy: 'admin' })
            });
            if (res.ok) {
                loadData();
            }
        } catch (error) {
            console.error('Failed to reject:', error);
        }
        setProcessing(null);
    };

    const handleCreateRequest = async () => {
        if (!newRequest.staffId || !newRequest.startDate || !newRequest.endDate) return;

        setProcessing('new');
        try {
            const res = await fetch(`${API_URL}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest)
            });
            if (res.ok) {
                setShowNewRequest(false);
                setNewRequest({ staffId: '', type: 'annual', startDate: '', endDate: '', days: 1, reason: '' });
                loadData();
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to create request');
            }
        } catch (error) {
            console.error('Failed to create request:', error);
        }
        setProcessing(null);
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Rejected</span>;
            default:
                return null;
        }
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            annual: 'bg-blue-500/20 text-blue-400',
            sick: 'bg-orange-500/20 text-orange-400',
            unpaid: 'bg-gray-500/20 text-gray-400',
            family: 'bg-purple-500/20 text-purple-400'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${colors[type] || colors.unpaid}`}>{type}</span>;
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-gold" />
                        Leave Management
                    </h1>
                    <p className="text-gray-400 mt-1">Manage staff leave requests and balances</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowNewRequest(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
                    <div className="text-2xl font-bold text-white">{requests.length}</div>
                    <div className="text-sm text-gray-400">Total Requests</div>
                </div>
                <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
                    <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
                    <div className="text-sm text-gray-400">Pending Approval</div>
                </div>
                <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
                    <div className="text-2xl font-bold text-green-400">
                        {requests.filter(r => r.status === 'approved').length}
                    </div>
                    <div className="text-sm text-gray-400">Approved</div>
                </div>
                <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)]">
                    <div className="text-2xl font-bold text-red-400">
                        {requests.filter(r => r.status === 'rejected').length}
                    </div>
                    <div className="text-sm text-gray-400">Rejected</div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f
                                ? 'bg-gold text-obsidian'
                                : 'bg-[var(--bg-card)] text-gray-400 hover:text-white'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No leave requests found
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-[var(--surface-bg)] border-b border-[var(--border-color)]">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Staff</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Type</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Dates</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Days</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Reason</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Note</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(request => (
                                <tr key={request.id} className="border-b border-[var(--border-color)] hover:bg-white/5">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--surface-bg)] flex items-center justify-center">
                                                {request.staff?.facePhotoUrl && (request.staff.facePhotoUrl.startsWith('http') || request.staff.facePhotoUrl.startsWith('/uploads')) ? (
                                                    <img src={request.staff.facePhotoUrl.startsWith('http')
                                                        ? request.staff.facePhotoUrl
                                                        : `${API_URL}${request.staff.facePhotoUrl}`}
                                                        alt="" className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {request.staff?.firstName?.[0]}{request.staff?.lastName?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-white font-medium">
                                                {request.staff?.firstName} {request.staff?.lastName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">{getTypeBadge(request.type)}</td>
                                    <td className="p-4 text-gray-300 text-sm">
                                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-white font-medium">{request.days}</td>
                                    <td className="p-4 text-gray-400 text-sm max-w-[200px] truncate">
                                        {request.reason || '-'}
                                    </td>
                                    <td className="p-4">
                                        {request.doctorNoteUrl ? (
                                            <a
                                                href={request.doctorNoteUrl.startsWith('http')
                                                    ? request.doctorNoteUrl
                                                    : `${API_URL}${request.doctorNoteUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                            >
                                                <AlertTriangle className="w-3 h-3" />
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-gray-600 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">{getStatusBadge(request.status)}</td>
                                    <td className="p-4">
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={processing === request.id}
                                                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={processing === request.id}
                                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* New Request Modal */}
            {showNewRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">New Leave Request</h2>
                            <button onClick={() => setShowNewRequest(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Staff Member</label>
                                <select
                                    value={newRequest.staffId}
                                    onChange={e => setNewRequest({ ...newRequest, staffId: e.target.value })}
                                    className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white"
                                >
                                    <option value="">Select staff...</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Leave Type</label>
                                <select
                                    value={newRequest.type}
                                    onChange={e => setNewRequest({ ...newRequest, type: e.target.value })}
                                    className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white"
                                >
                                    <option value="annual">Annual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="unpaid">Unpaid Leave</option>
                                    <option value="family">Family Responsibility</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newRequest.startDate}
                                        onChange={e => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                        className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newRequest.endDate}
                                        onChange={e => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                        className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Number of Days</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={newRequest.days}
                                    onChange={e => setNewRequest({ ...newRequest, days: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
                                <textarea
                                    value={newRequest.reason}
                                    onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })}
                                    className="w-full bg-[var(--surface-bg)] border border-[var(--border-color)] rounded-lg p-3 text-white h-20 resize-none"
                                    placeholder="Reason for leave..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowNewRequest(false)}
                                className="flex-1 btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRequest}
                                disabled={processing === 'new' || !newRequest.staffId}
                                className="flex-1 btn btn-primary"
                            >
                                {processing === 'new' ? 'Creating...' : 'Create Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Detail Modal (opens after approve) */}
            {detailRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Leave Request Details</h2>
                            <button onClick={() => setDetailRequest(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--surface-bg)] flex items-center justify-center">
                                    {detailRequest.staff?.facePhotoUrl && (detailRequest.staff.facePhotoUrl.startsWith('http') || detailRequest.staff.facePhotoUrl.startsWith('/uploads')) ? (
                                        <img src={detailRequest.staff.facePhotoUrl.startsWith('http')
                                            ? detailRequest.staff.facePhotoUrl
                                            : `${API_URL}${detailRequest.staff.facePhotoUrl}`}
                                            alt="" className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-400">
                                            {detailRequest.staff?.firstName?.[0]}{detailRequest.staff?.lastName?.[0]}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-medium">
                                        {detailRequest.staff?.firstName} {detailRequest.staff?.lastName}
                                    </div>
                                    <div className="text-gray-400 text-sm">Staff ID: {detailRequest.staffId}</div>
                                </div>
                                <div className="ml-auto">{getStatusBadge(detailRequest.status)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Leave Type</div>
                                    <div>{getTypeBadge(detailRequest.type)}</div>
                                </div>
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Days</div>
                                    <div className="text-white font-medium">{detailRequest.days} day(s)</div>
                                </div>
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Start Date</div>
                                    <div className="text-white text-sm">{new Date(detailRequest.startDate).toLocaleDateString()}</div>
                                </div>
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">End Date</div>
                                    <div className="text-white text-sm">{new Date(detailRequest.endDate).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {detailRequest.reason && (
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Reason</div>
                                    <div className="text-white text-sm">{detailRequest.reason}</div>
                                </div>
                            )}

                            {detailRequest.doctorNoteUrl && (
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Doctor's Note</div>
                                    <a
                                        href={detailRequest.doctorNoteUrl.startsWith('http')
                                            ? detailRequest.doctorNoteUrl
                                            : `${API_URL}${detailRequest.doctorNoteUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                    >
                                        <AlertTriangle className="w-3 h-3" /> View Doctor's Note
                                    </a>
                                </div>
                            )}

                            {detailRequest.approvedBy && (
                                <div className="bg-[var(--surface-bg)] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Processed By</div>
                                    <div className="text-white text-sm">{detailRequest.approvedBy}</div>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                                Submitted: {new Date(detailRequest.createdAt).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDetailRequest(null)}
                                className="flex-1 btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
