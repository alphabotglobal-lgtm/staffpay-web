'use client';
import { useState, useEffect, useCallback } from 'react';
import {
    Sparkles, Trash2, Edit3, AlertCircle, Clock, CheckCircle2,
    X, Save, XCircle, Loader2, Filter, RefreshCw,
    FileText, Calendar, DollarSign, Users, MapPin, Shield, Download, Settings
} from 'lucide-react';

interface AiTask {
    id: string;
    type: string;
    label: string;
    description?: string;
    status: string;
    result?: any;
    prompt?: string;
    source?: string;
    createdAt: string;
    updatedAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; border: string; bg: string }> = {
    payroll: { icon: DollarSign, color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10' },
    roster: { icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
    report: { icon: FileText, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
    staff: { icon: Users, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
    attendance: { icon: Clock, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
    leave: { icon: Calendar, color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10' },
    compliance: { icon: Shield, color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
    export: { icon: Download, color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
    zones: { icon: MapPin, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
    settings: { icon: Settings, color: 'text-gray-400', border: 'border-gray-500/30', bg: 'bg-gray-500/10' },
    query: { icon: Sparkles, color: 'text-white/60', border: 'border-white/20', bg: 'bg-white/5' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400' },
    running: { label: 'Running', icon: Loader2, color: 'text-blue-400' },
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-400' },
    failed: { label: 'Failed', icon: XCircle, color: 'text-red-400' },
    cancelled: { label: 'Cancelled', icon: X, color: 'text-white/40' },
};

export default function AiAssistPage() {
    const [tasks, setTasks] = useState<AiTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<AiTask | null>(null);
    const [editForm, setEditForm] = useState({ label: '', description: '', status: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== 'all') params.set('type', filterType);
            if (filterStatus !== 'all') params.set('status', filterStatus);

            const res = await fetch(`/api/ai/tasks?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch AI tasks', error);
        } finally {
            setIsLoading(false);
        }
    }, [filterType, filterStatus]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleDelete = async (task: AiTask) => {
        if (!confirm(`Delete task: "${task.label}"?`)) return;
        try {
            const res = await fetch(`/api/ai/tasks/${task.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            fetchTasks();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const handleEdit = (task: AiTask) => {
        setEditingTask(task);
        setEditForm({
            label: task.label,
            description: task.description || '',
            status: task.status,
        });
    };

    const handleSave = async () => {
        if (!editingTask) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/ai/tasks/${editingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEditingTask(null);
            fetchTasks();
        } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getTypeConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.query;
    const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    const activeTypes = [...new Set(tasks.map(t => t.type))];
    const counts = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        running: tasks.filter(t => t.status === 'running').length,
        failed: tasks.filter(t => t.status === 'failed').length,
    };

    return (
        <div className="h-full overflow-y-auto bg-[#050505] p-8 text-white">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                        <Sparkles className="h-6 w-6 text-gold" />
                        AI Management Center <span className="text-lg font-medium text-white/40">Task Board</span>
                    </h1>
                    <p className="mt-2 text-white/50">Every action CORTEX performs is tracked here. Your AI operations history and task management center.</p>
                </div>
                <button onClick={fetchTasks} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </header>

            {/* Stats bar */}
            <div className="mb-8 grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Tasks', value: counts.total, color: 'text-white' },
                    { label: 'Completed', value: counts.completed, color: 'text-green-400' },
                    { label: 'Running', value: counts.running, color: 'text-blue-400' },
                    { label: 'Failed', value: counts.failed, color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</p>
                        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-white/50">
                    <Filter size={14} />
                    <span>Filter:</span>
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                    <option value="all">All Types</option>
                    {activeTypes.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="running">Running</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Task list */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-20 text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-white/10" />
                    <h3 className="mt-4 text-2xl font-bold">No AI tasks yet</h3>
                    <p className="mt-2 text-white/40">Ask CORTEX to do something in the AI Chat and it will appear here automatically.</p>
                    <a href="/ai/chat" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-obsidian hover:bg-gold/90 transition-colors">
                        <Sparkles size={16} />
                        Open AI Chat
                    </a>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => {
                        const typeConf = getTypeConfig(task.type);
                        const statusConf = getStatusConfig(task.status);
                        const TypeIcon = typeConf.icon;
                        const StatusIcon = statusConf.icon;

                        return (
                            <div key={task.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-gold/30 hover:bg-white/[0.06]">
                                {/* Background icon */}
                                <div className="absolute -right-3 -top-3 opacity-[0.06] transition-transform group-hover:scale-110">
                                    <TypeIcon size={100} />
                                </div>

                                {/* Top row: type badge + actions */}
                                <div className="mb-3 flex items-center justify-between relative z-10">
                                    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border ${typeConf.border} ${typeConf.bg} ${typeConf.color}`}>
                                        <TypeIcon size={12} />
                                        {task.type}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button onClick={() => handleEdit(task)} className="rounded-lg p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(task)} className="rounded-lg p-1.5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Label */}
                                <h3 className="text-lg font-bold leading-tight line-clamp-2">{task.label}</h3>

                                {/* Prompt preview */}
                                {task.prompt && (
                                    <p className="mt-1.5 text-xs leading-relaxed text-white/30 line-clamp-2 italic">&ldquo;{task.prompt}&rdquo;</p>
                                )}

                                {/* Footer */}
                                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
                                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                                        <Clock size={12} />
                                        <span>{new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${statusConf.color}`}>
                                        <StatusIcon size={14} className={task.status === 'running' ? 'animate-spin' : ''} />
                                        {statusConf.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setEditingTask(null)}>
                    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Edit Task</h2>
                            <button onClick={() => setEditingTask(null)} className="rounded-lg p-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Label</label>
                                <input
                                    type="text"
                                    value={editForm.label}
                                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Description</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-gold/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="running">Running</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {editingTask.prompt && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Original Prompt</label>
                                    <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/40 italic">&ldquo;{editingTask.prompt}&rdquo;</p>
                                </div>
                            )}

                            {editingTask.result && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/50">Result</label>
                                    <pre className="max-h-32 overflow-auto rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/40 font-mono">
                                        {JSON.stringify(editingTask.result, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingTask(null)}
                                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-obsidian hover:bg-gold/90 disabled:opacity-50 transition-colors"
                            >
                                <Save size={16} />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
