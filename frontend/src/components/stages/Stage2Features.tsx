'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react'
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

  // ✅ FIX: use index instead of id
  const [expandedEpicIndex, setExpandedEpicIndex] = useState<number | null>(null)

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

  const handleToggle = async (
    epicId: string,
    featureId: string,
    enabled: boolean
  ) => {
    setTogglingId(featureId)
    try {
      const res = await stage2Api.toggleFeature(
        project.id,
        epicId,
        featureId,
        enabled
      )
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
      toast.success('Feature Manifesto locked!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  const totalFeatures =
    stage?.epics?.reduce(
      (sum: number, e: any) => sum + e.features.length,
      0
    ) || 0

  const enabledFeatures =
    stage?.epics?.reduce(
      (sum: number, e: any) =>
        sum + e.features.filter((f: any) => f.enabled !== false).length,
      0
    ) || 0

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
       <div className="w-16 h-16 rounded-2xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center">
          <Zap className="w-8 h-8 text-forge-500" />
        </div>
        <h2 className="font-bold text-2xl">Feature Mapping</h2>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          {generating ? 'Loading...' : 'Extract Features'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Feature Mapping</h2>
          <p className="text-sm text-muted-foreground">
            {enabledFeatures}/{totalFeatures} features selected
          </p>
        </div>

        {!isCompleted && (
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
          >
            {confirming ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm
              </>
            )}
          </button>
        )}
      </div>

      {/* Epics Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {stage.epics?.map((epic: any, ei: number) => {
          const isExpanded = expandedEpicIndex === ei

          return (
            <motion.div
              key={ei}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ei * 0.05 }}
              className="card-glass rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Epic Header */}
              <div
                onClick={() =>
                  setExpandedEpicIndex(isExpanded ? null : ei)
                }
                className="px-5 py-4 border-b border-border/40 bg-secondary/60"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base">
                    {epic.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {isExpanded ? '▲ Less' : '▼ Details'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {epic.description}
                </p>
              </div>

              {/* Features */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="divide-y divide-border/30 overflow-hidden"
                  >
                    {epic.features?.map((feature: any) => {
                      const enabled = feature.enabled !== false
                      const isToggling = togglingId === feature.id

                      return (
                        <div
                          key={feature.id}
                          className={cn(
                            'px-5 py-3 flex items-start gap-3 transition-all',
                            !enabled && 'opacity-50'
                          )}
                        >
                          <button
                            onClick={() =>
                              !isCompleted &&
                              handleToggle(
                                epic.id,
                                feature.id,
                                !enabled
                              )
                            }
                            disabled={isCompleted || isToggling}
                            className="flex-shrink-0 mt-0.5"
                          >
                            {isToggling ? (
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : enabled ? (
                              <ToggleRight className="w-5 h-5 text-forge-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium">
                                {feature.name}
                              </p>
                              <span
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded font-medium',
                                  feature.priority === 'must-have'
                                    ? 'bg-red-400/10 text-red-400'
                                    : feature.priority === 'should-have'
                                    ? 'bg-yellow-400/10 text-yellow-400'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {feature.priority || 'nice-to-have'}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}