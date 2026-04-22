'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!token) {
      router.push('/login')
    } else {
      // Fetch current user data if we have a token but no user data
      fetchCurrentUser()
    }
  }, [token, router, fetchCurrentUser])

  if (!token) {
    return null // Will redirect
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-background">
        {children}
      </main>
    </>
  )
}
