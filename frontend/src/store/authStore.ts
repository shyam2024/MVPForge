import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: string
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  bio: string | null
  created_at: string
}

interface AuthStore {
  token: string | null
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string | undefined, username: string | undefined, password: string) => Promise<void>
  register: (fullName: string, username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  fetchCurrentUser: () => Promise<void>
  updateProfile: (data: { full_name?: string; bio?: string; avatar_url?: string }) => Promise<void>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const useAuthStore = create<AuthStore>()(persist(
  (set, get) => ({
    token: null,
    user: null,
    isLoading: false,
    error: null,

    login: async (email: string | undefined, username: string | undefined, password: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await axios.post(`${API_URL}/auth/login`, { 
          email: email || null,
          username: username || null,
          password 
        })
        const { access_token } = response.data

        set({ token: access_token, isLoading: false })
        
        // Fetch user data after successful login
        await get().fetchCurrentUser()
      } catch (error) {
        const errorMessage = getBackendError(error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    register: async (fullName: string, username: string, email: string, password: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          full_name: fullName,
          username,
          email,
          password,
        })

        const userData = response.data
        const user: User = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          is_active: userData.is_active,
          is_verified: userData.is_verified,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          created_at: userData.created_at,
        }

        set({ user, isLoading: false })
      } catch (error) {
        const errorMessage = getBackendError(error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    fetchCurrentUser: async () => {
      const { token } = get()
      if (!token) return

      try {
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const userData = response.data
        const user: User = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          is_active: userData.is_active,
          is_verified: userData.is_verified,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          created_at: userData.created_at,
        }

        set({ user })
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        // Don't set error state to avoid breaking the UI
        // User will be null but app can still function
      }
    },

    logout: () => {
      set({ token: null, user: null, error: null })
    },

    clearError: () => {
      set({ error: null })
    },

    updateProfile: async (data: { full_name?: string; bio?: string; avatar_url?: string }) => {
      set({ isLoading: true, error: null })
      try {
        const { token } = get()
        if (!token) {
          throw new Error('Not authenticated')
        }

        const response = await axios.patch(`${API_URL}/auth/me`, data, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const userData = response.data
        const user: User = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          is_active: userData.is_active,
          is_verified: userData.is_verified,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          created_at: userData.created_at,
        }

        set({ user, isLoading: false })
      } catch (error) {
        const errorMessage = getBackendError(error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ token: state.token, user: state.user }),
  }
))

function getBackendError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (detail) {
      return typeof detail === 'string' ? detail : JSON.stringify(detail)
    }

    if (status === 400) return 'Invalid email or username'
    if (status === 401) return 'Invalid email or password'
    if (status === 403) return 'Account is deactivated'
    if (status === 409) return 'Email or username already taken'
    if (status === 500) return 'Server error. Please try again later'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}