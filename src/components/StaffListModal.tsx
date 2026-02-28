import { X, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface StaffMember {
    id: number | string;
    name: string;
    role: string;
    zone: string;
    status: string;
    hours?: string; // Hours info for display
    photoUrl?: string; // Profile photo URL
}

interface StaffListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    staff: StaffMember[];
}

export default function StaffListModal({ isOpen, onClose, title, staff }: StaffListModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {staff.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No staff found for this category.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {staff.map((member) => (
                                <Link
                                    key={member.id}
                                    href={`/payroll?staffId=${member.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition group"
                                >
                                    {/* Profile Photo or Default Icon */}
                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-bg)] flex items-center justify-center text-[var(--text-secondary)] overflow-hidden">
                                        {member.photoUrl && (member.photoUrl.startsWith('http') || member.photoUrl.startsWith('/uploads')) ? (
                                            <img
                                                src={member.photoUrl.startsWith('http')
                                                    ? member.photoUrl
                                                    : `${API_URL}${member.photoUrl}`
                                                }
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white group-hover:text-gold transition">
                                                {member.name}
                                            </span>
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${member.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                member.status === 'overtime' ? 'bg-red-500/10 text-red-500' :
                                                    member.status === 'absent' ? 'bg-orange-500/10 text-orange-500' :
                                                        'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 flex gap-2">
                                            <span>{member.role.toUpperCase()}</span>
                                            {member.zone && <><span>•</span><span>{member.zone}</span></>}
                                        </div>
                                    </div>
                                    {/* Hours Display */}
                                    {member.hours && (
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gold">
                                                {member.hours}
                                            </span>
                                        </div>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-color)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
