'use client'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to build your next MVP?
          </p>
        </div>

        {/* Placeholder for dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 hover:border-forge-500/50 transition-colors cursor-pointer"
            >
              <div className="aspect-video bg-gradient-to-br from-forge-500/10 to-blue-600/10 rounded-xl mb-4" />
              <h3 className="font-semibold mb-2">Project {i + 1}</h3>
              <p className="text-sm text-muted-foreground">Click to start building</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
