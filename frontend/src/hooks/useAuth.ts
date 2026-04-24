import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { token, user, isLoading, error, login, register, logout, clearError, fetchCurrentUser } = useAuthStore()
  
  return {
    token,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    fetchCurrentUser,
    isAuthenticated: !!token,
  }
}

export function useRequireAuth() {
  const router = useRouter()
  const auth = useAuth()
  const { token, user } = auth

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  return {
    ...auth,
    isAuthenticated: !!token,
  }
}

export function useRedirectIfAuth() {
  const router = useRouter()
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      router.push('/dashboard')
    }
  }, [token, router])
}