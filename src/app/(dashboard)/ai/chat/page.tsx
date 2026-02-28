'use client';
import AiAssistBot from '@/components/AiAssistBot';

export default function AiChatPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-6 bg-[var(--background-secondary)]">
            <div className="flex-1 max-w-5xl mx-auto w-full">
                <AiAssistBot />
            </div>
        </div>
    );
}
