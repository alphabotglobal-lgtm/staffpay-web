'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const MobileShield: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            // Check width or user agent for mobile
            const widthMatch = window.innerWidth < 768;
            const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            setIsMobile(widthMatch || uaMatch);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Blur Overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

            {/* Content Container */}
            <div className="relative glass-glow p-8 rounded-2xl max-w-sm w-full flex flex-col items-center">
                <div className="mb-6 relative w-20 h-20">
                    <Image
                        src="/logo.png"
                        alt="StaffPay Logo"
                        fill
                        className="object-contain"
                    />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">
                    Desktop Experience Only
                </h1>

                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    The StaffPay dashboard is designed for high-precision professional desktop use. For staff sign-ins and field operations, please use our dedicated mobile application.
                </p>

                <div className="flex flex-col gap-4 w-full">
                    <a
                        href="#"
                        className="bg-gold text-obsidian px-6 py-3 rounded-xl font-bold bounce-hover shadow-lg shadow-gold/20 active:scale-95 transition-all text-center"
                        onClick={(e) => {
                            // In a real app, this would link to store
                            e.preventDefault();
                            alert("Please check your email for the App Store / Play Store links.");
                        }}
                    >
                        Launch Mobile App
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MobileShield;
