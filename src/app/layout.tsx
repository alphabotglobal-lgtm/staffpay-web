import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'

import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'StaffPay - Staff Management',
    description: 'Professional Staff Management Dashboard',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
                    <ThemeProvider>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </ThemeProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    )
}
