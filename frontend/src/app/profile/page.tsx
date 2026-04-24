'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Loader2, User, Mail, AtSign, FileText, Save, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { useRequireAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage, formatDate } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Must be at least 2 characters'),
  bio: z.string().max(200, 'Max 200 characters').optional(),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { isAuthenticated } = useRequireAuth()
  const { user, updateProfile, isLoading } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile({
        full_name: data.full_name,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
      })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (!isAuthenticated || !user) return null

  const initials = user.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Profile Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Avatar */}
          <div className="card-glass rounded-2xl p-6 mb-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forge-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-2xl" />
              ) : initials}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">{user.full_name}</h2>
              <p className="text-muted-foreground text-sm">@{user.username}</p>
              <p className="text-xs text-muted-foreground mt-1">Member since {formatDate(user.created_at)}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="card-glass rounded-2xl p-6 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4 text-muted-foreground" /> Full Name
              </label>
              <input
                {...register('full_name')}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all"
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <AtSign className="w-4 h-4 text-muted-foreground" /> Username
              </label>
              <input
                value={user.username}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Bio
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all resize-none"
              />
              {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio.message}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                Avatar URL
              </label>
              <input
                {...register('avatar_url')}
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all"
              />
              {errors.avatar_url && <p className="text-red-400 text-xs mt-1">{errors.avatar_url.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isDirty}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forge-600 hover:bg-forge-500 disabled:opacity-50 text-white font-medium transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
