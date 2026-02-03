'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, Loader2, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { APP_NAME } from '@/lib/constants'
import ReactMarkdown from 'react-markdown'
import { useSession } from 'next-auth/react'

interface ChatInterfaceProps {
    chatId: string | null;
    onSelectChat: (id: string) => void;
    onToggleSidebar: () => void;
}

interface Message {
    id?: string;
    role: 'user' | 'model';
    content: string;
    createdAt?: string;
}

export function ChatInterface({ chatId, onSelectChat, onToggleSidebar }: ChatInterfaceProps) {
    const { data: session } = useSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);
        } else {
            setMessages([]);
        }
    }, [chatId])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, loading])

    const fetchMessages = async (id: string) => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await fetch(`http://localhost:4000/api/chats/${id}?userId=${session?.user?.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            } else {
                console.error("Failed to load chat");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const content = input;
        const userMsg: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:4000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // @ts-ignore
                body: JSON.stringify({ prompt: content, chatId, userId: session?.user?.id })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            if (data.response) {
                const botMsg: Message = { role: 'model', content: data.response };
                setMessages(prev => [...prev, botMsg]);
                if (!chatId && data.chatId) {
                    onSelectChat(data.chatId);
                }
            }
        } catch (error: any) {
            console.error("Error", error);
            const errorMsg: Message = { role: 'model', content: `Error: ${error.message}` };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-950 text-gray-100 relative">
            {/* Header */}
            <header className="flex items-center p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={onToggleSidebar} className="mr-4 md:hidden text-gray-400 hover:text-white">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    {chatId ? 'Chat' : 'New Conversation'}
                </h1>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                import {APP_NAME} from '@/lib/constants'

                //...

                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                        <img src="/logo.png" alt="Logo" className="w-16 h-16 mb-4 object-contain opacity-80" />
                        <p className="text-lg">Start a conversation with {APP_NAME}</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex gap-4 max-w-4xl mx-auto",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1 bg-transparent">
                                <img src="/logo.png" alt="AI" className="w-full h-full object-contain" />
                            </div>
                        )}

                        <div className={clsx(
                            "rounded-2xl px-5 py-3 max-w-[85%] sm:max-w-[75%]",
                            msg.role === 'user'
                                ? "bg-blue-600/20 md:bg-blue-600 text-blue-100 md:text-white rounded-tr-none"
                                : msg.content.startsWith('Error:')
                                    ? "bg-red-900/50 text-red-200 border border-red-700/50 rounded-tl-none"
                                    : "bg-gray-800/80 text-gray-200 rounded-tl-none border border-gray-700/50"
                        )}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                                <User className="w-5 h-5 text-gray-300" />
                            </div>
                        )}
                    </motion.div>
                ))}

                {loading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-4 max-w-4xl mx-auto items-end mb-4"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-transparent">
                            <img src="/logo.png" alt="AI" className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-gray-800/80 rounded-2xl rounded-tl-none px-3 py-2 border border-gray-700/50 flex items-center gap-1 min-h-[32px]">
                            <span className="sr-only">Typing...</span>
                            <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                            />
                            <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            />
                            <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                            />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-md">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-lg"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <p className="text-center text-xs text-gray-600 mt-2">
                    AI can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    )
}
