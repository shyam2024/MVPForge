'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ToggleLeft, ToggleRight, CheckCircle, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage2Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

export function Stage2Features({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const stage = project.stage2
  const isCompleted = stage?.status === 'completed'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage2Api.generate(project.id)
      onUpdate(res.data)
      toast.success('Features extracted!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleToggle = async (epicId: string, featureId: string, enabled: boolean) => {
    setTogglingId(featureId)
    try {
      const res = await stage2Api.toggleFeature(project.id, epicId, featureId, enabled)
      onUpdate(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await stage2Api.confirm(project.id)
      onUpdate(res.data)
      toast.success('Feature Manifesto locked! Moving to Backlog.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  const totalFeatures = stage?.epics?.reduce((sum: number, e: any) => sum + e.features.length, 0) || 0
  const enabledFeatures = stage?.epics?.reduce(
    (sum: number, e: any) => sum + e.features.filter((f: any) => f.enabled !== false).length, 0
  ) || 0

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Zap className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="font-display font-bold text-2xl">Feature Mapping</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          AI will analyze your Product Vision Document and extract epics and features.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {generating ? 'Extracting Features...' : 'Extract Features'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl">Feature Mapping</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enabledFeatures}/{totalFeatures} features selected across {stage.epics?.length || 0} epics
          </p>
        </div>
        {!isCompleted && stage.epics?.length > 0 && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-green-500/20"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Confirm Features
          </button>
        )}
        {isCompleted && (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Manifesto Locked
          </div>
        )}
      </div>

      {/* Epics grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
        {stage.epics?.map((epic: any, ei: number) => (
          <motion.div
            key={epic.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ei * 0.06 }}
            className="card-glass rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/40 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">Epic</span>
              </div>
              <h3 className="font-display font-bold text-base">{epic.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{epic.description}</p>
            </div>

            <div className="divide-y divide-border/30">
              {epic.features?.map((feature: any) => {
                const enabled = feature.enabled !== false
                const isToggling = togglingId === feature.id
                return (
                  <div key={feature.id} className={cn('px-5 py-3 flex items-start gap-3 transition-all', !enabled && 'opacity-50')}>
                    <button
                      onClick={() => !isCompleted && handleToggle(epic.id, feature.id, !enabled)}
                      disabled={isCompleted || isToggling}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {isToggling ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : enabled ? (
                        <ToggleRight className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded text-xs font-medium',
                          feature.priority === 'must-have' ? 'bg-red-400/10 text-red-400' :
                          feature.priority === 'should-have' ? 'bg-yellow-400/10 text-yellow-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {feature.priority || 'nice-to-have'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
