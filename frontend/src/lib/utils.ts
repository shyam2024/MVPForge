import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (detail) {
      return typeof detail === 'string' ? detail : JSON.stringify(detail)
    }

    if (status === 400) return 'Invalid request. Please check your input.'
    if (status === 401) return 'Invalid email or password'
    if (status === 403) return 'Account is deactivated'
    if (status === 409) return 'Email or username already taken'
    if (status === 500) return 'Server error. Please try again later'
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return (error as any).message
    }
  }

  return 'An unexpected error occurred. Please try again.'
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatRelative(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago'

    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago'

    interval = Math.floor(seconds / 86400)
    if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago'

    interval = Math.floor(seconds / 3600)
    if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago'

    interval = Math.floor(seconds / 60)
    if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago'

    return Math.floor(seconds) + ' second' + (seconds > 1 ? 's' : '') + ' ago'
  } catch {
    return dateString
  }
}

export function getStageLabel(stageNumber: number): string {
  const stages: Record<number, string> = {
    1: 'Discovery',
    2: 'Features',
    3: 'Backlog',
    4: 'Architecture',
    5: 'UI Prototyping',
    6: 'Master Plan',
    7: 'The Forge',
  }
  return stages[stageNumber] || `Stage ${stageNumber}`
}