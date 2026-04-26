'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Code2, Bell, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl h-16">
      <div className="h-full px-6 flex items-center justify-between max-w-screen-2xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-forge-600 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base hidden sm:block">GenAI Assistant</span>
        </Link>

        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl shadow-black/10 py-1 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" /> Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" /> Settings
                </Link>

                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors w-full text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
