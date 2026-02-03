'use client'

import { useSession, signIn } from "next-auth/react"
import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatInterface } from "@/components/ChatInterface"
import { Bot, Loader2 } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-blue-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-md w-full text-center space-y-6 z-10">
          <MotionDivPlaceholder className="flex justify-center">
            <div className="w-40 h-40 rounded-3xl bg-transparent flex items-center justify-center">
              <img src="/logo.png" alt="GunAI" className="w-40 h-40 object-contain" />
            </div>
          </MotionDivPlaceholder>
          <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2">
            GunAI
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Experience the power of GunAI. <br />
            Intelligent conversations, instant answers.
          </p>
          <div className="pt-4">
            <button
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transition-all active:scale-95 duration-200 shadow-xl hover:shadow-2xl hover:shadow-white/10"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden text-slate-200">
      <Sidebar
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <ChatInterface
        chatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  )
}

function MotionDivPlaceholder({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>
}
