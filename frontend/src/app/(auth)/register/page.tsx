'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Code2, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/lib/utils'
import { useRedirectIfAuth } from '@/hooks/useAuth'

const schema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  useRedirectIfAuth()
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.full_name, data.username, data.email, data.password)
      toast.success('Account created! Welcome aboard.')
      router.push('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full bg-forge/40 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-forge-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">GenAI Assistant</span>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">Start building software with AI today</p>
        </div>

        <div className="card-glass rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                {...register('full_name')}
                type="text"
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1.5">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  {...register('username')}
                  type="text"
                  placeholder="jane_smith"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {errors.username && <p className="text-red-400 text-xs mt-1.5">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="jane@example.com"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-forge-600 hover:bg-forge-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-forge-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-forge-400 hover:text-forge-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
