'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    MapPin,
    Calendar,
    DollarSign,
    CreditCard,
    Settings,
    LogOut,
    Moon,
    Sun,
    Mail,
    Briefcase,
    FileSpreadsheet,
    FileEdit,
    ShieldCheck,
    Sparkles,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Staff', href: '/staff' },
    { icon: Calendar, label: 'Rosters', href: '/rosters' },
    { icon: DollarSign, label: 'Payroll', href: '/payroll' },
    { icon: FileEdit, label: 'Overrides', href: '/payroll/overrides' },
    { icon: ShieldCheck, label: 'Compliance', href: '/payroll/compliance' },
    { icon: Briefcase, label: 'Leave Requests', href: '/leave' },
    { icon: Sparkles, label: 'AI Management', href: '/ai' },
];

const settingsSubItems = [
    { icon: Settings, label: 'General', href: '/settings' },
    { icon: MapPin, label: 'Zones', href: '/zones' },
    { icon: Briefcase, label: 'Pay Groups', href: '/pay-groups' },
    { icon: FileSpreadsheet, label: 'Bulk Actions', href: '/management/bulk' },
    { icon: Mail, label: 'Reports', href: '/reports' },
    { icon: CreditCard, label: 'Billing', href: '/billing' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { selectedRole, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [settingsOpen, setSettingsOpen] = useState(
        pathname === '/settings' || pathname === '/reports' || pathname?.startsWith('/management') || pathname === '/zones' || pathname === '/pay-groups' || pathname === '/billing'
    );

    const isLight = theme === 'light';

    if (pathname === '/login') return null;

    const isSettingsActive = pathname === '/settings' || pathname === '/reports' || pathname?.startsWith('/management') || pathname === '/zones' || pathname === '/pay-groups' || pathname === '/billing';

    return (
        <aside className="w-56 flex flex-col" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)' }}>
            {/* Logo */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10 shadow-[0_0_12px_rgba(250,204,21,0.08)]">
                        <Image src="/mascot.svg" alt="StaffPay" width={28} height={28} />
                    </div>
                    <div>
                        <h1 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>StaffPay</h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-3 overflow-y-auto">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'border-l-2 border-gold'
                                    : 'border-l-2 border-transparent hover:bg-white/5'
                                    }`}
                                style={isActive
                                    ? { background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)' }
                                    : { color: 'var(--text-secondary)' }}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Settings with collapsible sub-items */}
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${isSettingsActive && !settingsOpen
                            ? 'border-l-2 border-gold'
                            : 'border-l-2 border-transparent hover:bg-white/5'}`}
                        style={isSettingsActive && !settingsOpen
                            ? { background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)' }
                            : { color: 'var(--text-secondary)' }}
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium">Settings</span>
                        </div>
                        {settingsOpen
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                        }
                    </button>
                    {settingsOpen && (
                        <div className="ml-4 space-y-1">
                            {settingsSubItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${isActive
                                            ? 'border-l-2 border-gold'
                                            : 'border-l-2 border-transparent hover:bg-white/5'}`}
                                        style={isActive
                                            ? { background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)' }
                                            : { color: 'var(--text-secondary)' }}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 hover:bg-white/5"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span className="text-sm font-medium">{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 mt-1 hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
