'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, Clock, User, FileText, ChevronRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRequireAuth } from '@/hooks/useAuth'
import { useProjectStore } from '@/store/projectStore'
import { Navbar } from '@/components/layout/Navbar'
import { cn, formatDate, formatRelative, getStageLabel, getErrorMessage } from '@/lib/utils'
import {
  Stage1Discovery,
  Stage2Features,
  Stage3Backlog,
  Stage4Architecture,
  Stage5UIPrototyping,
  Stage6MasterPlan,
  Stage7Forge
} from '@/components/stages'

const stages = [
  { num: 1, component: Stage1Discovery },
  { num: 2, component: Stage2Features },
  { num: 3, component: Stage3Backlog },
  { num: 4, component: Stage4Architecture },
  { num: 5, component: Stage5UIPrototyping },
  { num: 6, component: Stage6MasterPlan },
  { num: 7, component: Stage7Forge },
]

export default function ProjectPage() {
  const { isAuthenticated } = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { currentProject, fetchProject, isLoading, updateCurrentProject } = useProjectStore()
  const [activeStage, setActiveStage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadProject = async () => {
      try {
        setError(null)
        await fetchProject(projectId)
      } catch (err) {
        const msg = getErrorMessage(err)
        setError(msg)
        toast.error(msg)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }

    loadProject()
  }, [projectId, isAuthenticated, fetchProject, router])

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-forge-400" />
        </div>
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 max-w-7xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-300 mb-2">Project not found</h2>
            <p className="text-red-200/70 mb-4">{error || 'This project does not exist or you do not have access to it.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forge-600 hover:bg-forge-500 text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </motion.div>
        </main>
      </div>
    )
  }

  const completedStages = Object.entries(currentProject)
    .filter(([key, val]) => key.startsWith('stage') && val)
    .length

  const StageComponent = stages[activeStage - 1]?.component

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold mb-2">{currentProject.name}</h1>
              {currentProject.description && (
                <p className="text-muted-foreground max-w-2xl">{currentProject.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatRelative(currentProject.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Stage {currentProject.current_stage || 1} of 7
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Project Progress</h3>
            <span className="text-xs text-muted-foreground">{completedStages} of 7 stages</span>
          </div>
          <div className="w-full bg-foreground/5 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedStages / 7) * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-forge-600 to-forge-400"
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stages Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-10">
          {stages.map((stage) => {
            const isCompleted = Object.keys(currentProject).some(k =>
              k === `stage${stage.num}` && currentProject[k]
            )
            const isActive = activeStage === stage.num

            return (
              <motion.button
                key={stage.num}
                onClick={() => setActiveStage(stage.num)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative p-3 rounded-lg font-medium text-sm transition-all duration-200',
                  isActive
                    ? 'bg-forge-600 text-white shadow-lg shadow-forge-500/30'
                    : isCompleted
                      ? 'bg-forge-500/20 text-forge-300 hover:bg-forge-500/30'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                )}
              >
                Stage {stage.num}
                {isCompleted && <span className="absolute top-1 right-1 w-2 h-2 bg-forge-400 rounded-full" />}
              </motion.button>
            )
          })}
        </div>

        {/* Stage Content */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-card border border-border rounded-xl p-8"
        >
          {StageComponent && currentProject ? (
            <StageComponent
              project={currentProject}
              onUpdate={updateCurrentProject}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Stage {activeStage} component not found</p>
            </div>
          )}
        </motion.div>

        {/* Stage Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
            disabled={activeStage === 1}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeStage === 1
                ? 'bg-foreground/5 text-muted-foreground cursor-not-allowed'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            )}
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Stage {activeStage} of 7
          </span>

          <button
            onClick={() => setActiveStage(Math.min(7, activeStage + 1))}
            disabled={activeStage === 7}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              activeStage === 7
                ? 'bg-foreground/5 text-muted-foreground cursor-not-allowed'
                : 'bg-forge-600 hover:bg-forge-500 text-white'
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
