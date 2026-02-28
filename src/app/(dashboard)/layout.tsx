import Sidebar from '../../components/Sidebar'
import PageTransition from '../../components/PageTransition'
import RequireAuth from '../../components/RequireAuth'
import MobileShield from '../../components/MobileShield'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <RequireAuth>
            <MobileShield />
            <div className="flex min-h-screen bg-dashboard-gradient">
                <Sidebar />
                <main className="flex-1 flex flex-col h-screen overflow-hidden">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </RequireAuth>
    )
}
