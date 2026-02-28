'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Info, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Message {
    role: 'user' | 'bot';
    content: string;
    advice?: string;
    data?: any;
    action?: string;
    showData?: boolean; // Toggle for raw JSON
}

export default function AiAssistBot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content: "Hello! I am your StaffPay Total Operations Assistant. I can help you with tax compliance, financial data, and automated operations like roster and payroll generation.",
            advice: "Pro-Tip: You can ask me to 'email me daily with the absentee list' to create an automated AI Task."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const result = await apiClient.post<any>('/ai', { command: userMsg });

            setMessages(prev => [...prev, {
                role: 'bot',
                content: result.message || "I've processed your request.",
                advice: result.advice,
                data: result.data,
                action: result.action
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "I apologize, but I encountered an error connecting to my brain. Please try again in a moment.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionConfirm = async (action: string, params: any) => {
        setIsLoading(true);
        try {
            const result = await apiClient.post<any>('/ai', {
                command: action === 'confirm_and_save_roster' ? "Save and persist the draft roster" : "Confirm action"
            });

            setMessages(prev => [...prev, {
                role: 'bot',
                content: result.message || "Action confirmed successfully.",
                advice: result.advice,
                data: result.data,
                action: result.action
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "Failed to confirm action.",
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0A] text-white font-sans rounded-3xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Bot className="w-7 h-7 text-black" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">AI Operations Hub <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 ml-2">v2.6 PLATINUM</span></h2>
                        <p className="text-sm text-white/50 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Total Operations Assistant Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-green-500/20 text-green-400'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className="space-y-2">
                                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#4CAF50] text-black font-medium' : 'bg-white/5 border border-white/10 backdrop-blur-xl'}`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>

                                {msg.data && msg.action === 'generate_provisional_roster' && (
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#4CAF50] font-bold">
                                                <Calendar className="w-3 h-3" />
                                                Provisional Roster Preview
                                            </div>
                                            <span className="text-xs text-white/40">{msg.data.zoneName} - Week {msg.data.weekStart}</span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                <div key={i} className="text-[10px] text-center text-white/30 font-bold">{d}</div>
                                            ))}
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <div key={i} className="h-2 rounded-sm bg-[#4CAF50]/20 border border-[#4CAF50]/10 flex items-center justify-center">
                                                    {msg.data.assignments.some((a: any) => a.dayOfWeek === (i + 1) % 7) && (
                                                        <div className="w-1 h-1 rounded-full bg-[#4CAF50]" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-1">
                                            {msg.data.assignments.slice(0, 3).map((a: any, i: number) => (
                                                <div key={i} className="flex justify-between text-xs text-white/60">
                                                    <span>{a.staffName}</span>
                                                    <span className="text-white/30 capitalize">{a.shift}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleActionConfirm('confirm_and_save_roster', msg.data)}
                                            className="w-full py-2 rounded-lg bg-[#4CAF50] text-black text-xs font-bold hover:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Save & Persist Roster
                                        </button>
                                    </div>
                                )}

                                {msg.data && msg.action !== 'generate_provisional_roster' && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const newMessages = [...messages];
                                                newMessages[idx].showData = !newMessages[idx].showData;
                                                setMessages(newMessages);
                                            }}
                                            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40 font-bold hover:text-white transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            {msg.showData ? 'Hide Technical Data' : 'View Technical Data'}
                                        </button>

                                        {msg.showData && (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 overflow-hidden animate-in zoom-in-95 duration-200">
                                                <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-words p-3 bg-black/40 rounded-lg max-h-60 scrollbar-none">
                                                    {JSON.stringify(msg.data, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.advice && (
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 animate-in zoom-in-95 duration-500">
                                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                        <p className="text-sm text-blue-100 italic font-medium">{msg.advice}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="flex gap-3 items-center text-white/30 italic text-sm p-4">
                            <Bot className="w-4 h-4 animate-bounce" />
                            Analyzing operations and preparing response...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/5 border-t border-white/10 backdrop-blur-2xl">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="E.g. 'Create payroll for Zone B for last month'"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/50 transition-all placeholder:text-white/20 text-[15px]"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-[#4CAF50] text-black flex items-center justify-center hover:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-green-500/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {["Generate Zone A Roster", "Run Payroll Zone B", "Email daily absentees"].map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(s)}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-all transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
