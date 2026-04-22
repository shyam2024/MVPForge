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