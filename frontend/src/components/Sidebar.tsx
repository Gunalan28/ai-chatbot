'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, LogOut, Menu, X, Search, Trash2 } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { APP_NAME } from '@/lib/constants'

interface SidebarProps {
    onSelectChat: (chatId: string | null) => void;
    currentChatId: string | null;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function Sidebar({ onSelectChat, currentChatId, isOpen, setIsOpen }: SidebarProps) {
    const { data: session } = useSession()
    const [history, setHistory] = useState<any[]>([])
    const [showSignOut, setShowSignOut] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchHistory();
        }
    }, [session, currentChatId])

    const fetchHistory = async () => {
        try {
            // @ts-ignore
            const res = await fetch(`http://localhost:4000/api/history?userId=${session.user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    }

    const handleDelete = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            // @ts-ignore
            await fetch(`http://localhost:4000/api/chats/${chatId}?userId=${session?.user?.id}`, {
                method: 'DELETE'
            });
            setHistory(prev => prev.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                onSelectChat(null);
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
        }
    }

    const confirmSignOut = () => {
        signOut();
        setShowSignOut(false);
    }

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
                {/* Sign Out Modal */}
                {showSignOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-semibold text-white mb-2">Sign Out?</h3>
                            <p className="text-gray-400 mb-6">Are you sure you want to sign out directly?</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSignOut(false)}
                                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSignOut}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                className={clsx(
                    "fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800 transition-transform duration-300 transform",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >


                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">{APP_NAME}</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4">
                    <button
                        onClick={() => {
                            onSelectChat(null);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {history.map((chat) => (
                        <div key={chat.id} className="group relative">
                            <button
                                onClick={() => {
                                    onSelectChat(chat.id);
                                    setIsOpen(false);
                                }}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-colors pr-10",
                                    currentChatId === chat.id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                                )}
                            >
                                <MessageSquare className="w-4 h-4 min-w-[1rem]" />
                                <span className="truncate">{chat.title}</span>
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, chat.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Chat"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                                {session?.user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSignOut(true)}
                        className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 px-2 py-1 transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </>
    )
}
