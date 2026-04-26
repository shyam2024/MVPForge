'use client'
import Link from 'next/link'
import { ArrowLeft, Bell, Shield, Palette } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { useRequireAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { isAuthenticated } = useRequireAuth()
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
        </div>

        <div className="space-y-4">
          {[
            { icon: Bell, label: 'Notifications', desc: 'Manage email and push notification preferences' },
            { icon: Shield, label: 'Security', desc: 'Password, two-factor authentication, and sessions' },
            { icon: Palette, label: 'Appearance', desc: 'Theme and display preferences' },
          ].map((item) => (
            <div key={item.label} className="card-glass rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-foreground/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-forge-400" />
              </div>
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
