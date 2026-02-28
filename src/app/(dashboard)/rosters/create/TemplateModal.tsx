'use client';
import { useState, useEffect } from 'react';
import { X, Save, FileText, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';

interface Template {
    id: string;
    name: string;
    type: 'global' | 'zone';
    zoneId?: string;
    data: any;
    createdAt: string;
}

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'global' | 'zone';
    zoneId?: string; // Required if type is 'zone'
    zoneName?: string;
    currentData: any; // The data to save
    onLoad: (data: any) => void; // Callback when a template is loaded
}

export function TemplateModal({ isOpen, onClose, type, zoneId, zoneName, currentData, onLoad }: TemplateModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [mode, setMode] = useState<'list' | 'create'>('list');

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
            setMode('list');
            setNewTemplateName('');
        }
    }, [isOpen, type, zoneId]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ type });
            if (type === 'zone' && zoneId) params.append('zoneId', zoneId);

            const data = await apiClient.get<Template[]>(`/roster-templates?${params.toString()}`);
            setTemplates(data);
        } catch (e) {
            console.error('Failed to load templates', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newTemplateName.trim()) return;
        if (type === 'zone' && !zoneId) {
            alert('Error: Zone ID missing for zone template.');
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.post('/roster-templates', {
                name: newTemplateName,
                type,
                zoneId: type === 'zone' ? zoneId : undefined,
                data: currentData
            });
            await loadTemplates();
            setMode('list');
            setNewTemplateName('');
        } catch (e) {
            console.error('Failed to save template', e);
            alert('Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await apiClient.delete(`/roster-templates/${id}`);
            await loadTemplates();
        } catch (e) {
            console.error('Failed to delete template', e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--bg-secondary)] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            {type === 'global' ? 'Global Templates' : 'Zone Template'}
                        </h2>
                        <p className="text-xs text-gray-400">Manage your roster presets</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {mode === 'list' && (
                        <>
                            <button
                                onClick={() => setMode('create')}
                                className="w-full py-3 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/40 transition group"
                            >
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>{type === 'global' ? 'Save Global Template' : 'Save Zone Template'}</span>
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Templates</h3>
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                    </div>
                                ) : templates.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 text-sm">No templates found.</p>
                                ) : (
                                    templates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => {
                                                onLoad(template.data);
                                                onClose();
                                            }}
                                            className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-transparent cursor-pointer transition hover:bg-[var(--accent-gold)]/10 hover:border-[var(--accent-gold)]/30"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-[var(--accent-gold)]">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white group-hover:text-[var(--accent-gold)] transition-colors">
                                                        {template.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(template.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDelete(template.id, e)}
                                                    className="p-2 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {mode === 'create' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    {type === 'global' ? 'Global Template Name' : 'Zone Template Name'}
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="e.g. Standard Summer Roster"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--accent-gold)] focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMode('list')}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!newTemplateName.trim() || isSaving}
                                    className="flex-1 py-3 bg-gold text-obsidian rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Template
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
