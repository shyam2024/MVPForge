'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, GripVertical, Edit3, RefreshCw, ArrowRight, CheckSquare, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage3Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

function InvestBadge({ score }: { score: number }) {
  const color = score >= 0.8 ? 'text-green-400 bg-green-400/10' : score >= 0.6 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', color)}>
      INVEST {(score * 100).toFixed(0)}%
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { high: 'bg-red-400', medium: 'bg-yellow-400', low: 'bg-green-400' }
  return <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[priority] || 'bg-muted')} />
}

interface StoryCardProps {
  story: any
  projectId: string
  isCompleted: boolean
  onUpdate: (project: Project) => void
}

function StoryCard({ story, projectId, isCompleted, onUpdate }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [regenPrompt, setRegenPrompt] = useState('')
  const [showRegen, setShowRegen] = useState(false)
  const [moving, setMoving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const isConfirmed = story.status === 'confirmed'

  const handleMove = async () => {
    setMoving(true)
    try {
      const res = await stage3Api.moveStory(projectId, story.id, isConfirmed ? 'draft' : 'confirmed')
      onUpdate(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setMoving(false)
    }
  }

  const handleEditSave = async () => {
    if (!editingField) return
    setSaving(true)
    try {
      const res = await stage3Api.editStory(projectId, story.id, editingField, editValue)
      onUpdate(res.data)
      setEditingField(null)
      toast.success('Updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!regenPrompt.trim()) return
    setRegenerating(true)
    try {
      const res = await stage3Api.regenerateStory(projectId, story.id, regenPrompt)
      onUpdate(res.data)
      setShowRegen(false)
      setRegenPrompt('')
      toast.success('Story regenerated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      isConfirmed ? 'border-green-500/30 bg-green-500/5' : 'border-border/60 bg-card/50',
    )}>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <PriorityDot priority={story.priority} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{story.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{story.epic_name}</p>
          </div>
          {story.invest_score && <InvestBadge score={story.invest_score.total} />}
        </div>

        <p className="text-xs text-muted-foreground italic mb-3 leading-relaxed">
          As a <strong className="text-foreground">{story.as_a}</strong>, I want to{' '}
          <strong className="text-foreground">{story.i_want}</strong>, so that{' '}
          <span>{story.so_that}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? '▲ Less' : '▼ Details'}
          </button>
          <span className="flex-1" />
          {!isCompleted && (
            <>
              <button
                onClick={() => setShowRegen(!showRegen)}
                className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Regenerate with prompt"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMove}
                disabled={moving}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  isConfirmed
                    ? 'bg-muted text-muted-foreground hover:bg-accent'
                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                )}
              >
                {moving ? <Loader2 className="w-3 h-3 animate-spin" /> : isConfirmed ? '← Draft' : '✓ Confirm'}
              </button>
            </>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Acceptance Criteria</p>
              {story.acceptance_criteria?.map((ac: string, i: number) => (
                <div key={i} className="flex gap-2 mb-1">
                  <CheckSquare className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{ac}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Failure Criteria</p>
              {story.failure_criteria?.map((fc: string, i: number) => (
                <div key={i} className="flex gap-2 mb-1">
                  <span className="text-red-400 text-xs flex-shrink-0">✗</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{fc}</p>
                </div>
              ))}
            </div>
            {story.story_points && (
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{story.story_points} story points</span>
              </div>
            )}
          </div>
        )}

        {showRegen && !isCompleted && (
          <div className="mt-3 border-t border-border/40 pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">Describe modifications:</p>
            <textarea
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder="e.g. Make acceptance criteria more technical..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs outline-none focus:border-forge-500 resize-none"
            />
            <button
              onClick={handleRegenerate}
              disabled={regenerating || !regenPrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forge-600 hover:bg-forge-500 text-white text-xs font-medium disabled:opacity-50 transition-all"
            >
              {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Stage3Backlog({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const stage = project.stage3
  const isCompleted = stage?.status === 'completed'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage3Api.generate(project.id)
      onUpdate(res.data)
      toast.success('Backlog generated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await stage3Api.confirm(project.id)
      onUpdate(res.data)
      toast.success('Backlog confirmed! Moving to Architecture.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center">
          <CheckSquare className="w-8 h-8 text-forge-500" />
        </div>
        <h2 className="font-display font-bold text-2xl">Backlog Generation</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          AI will generate user stories with acceptance criteria and INVEST scores for each feature.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
          {generating ? 'Generating Backlog...' : 'Generate Backlog'}
        </button>
      </div>
    )
  }

  const stories: any[] = stage.user_stories || []
  const draftIds: string[] = stage.backlog?.draft || []
  const confirmedIds: string[] = stage.backlog?.confirmed || []
  const draftStories = stories.filter((s) => draftIds.includes(s.id))
  const confirmedStories = stories.filter((s) => confirmedIds.includes(s.id))

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl">Backlog</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {confirmedStories.length}/{stories.length} stories confirmed
          </p>
        </div>
        {!isCompleted && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-all"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Confirm Backlog
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-2 gap-5 min-h-0">
        {/* Draft column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Draft</h3>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{draftStories.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
            {draftStories.map((story, i) => (
              <motion.div key={story.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <StoryCard story={story} projectId={project.id} isCompleted={isCompleted} onUpdate={onUpdate} />
              </motion.div>
            ))}
            {draftStories.length === 0 && (
              <div className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center text-muted-foreground text-sm">
                All stories confirmed!
              </div>
            )}
          </div>
        </div>

        {/* Confirmed column */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <h3 className="text-sm font-semibold text-green-400">Confirmed</h3>
            <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full">{confirmedStories.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
            {confirmedStories.map((story, i) => (
              <motion.div key={story.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <StoryCard story={story} projectId={project.id} isCompleted={isCompleted} onUpdate={onUpdate} />
              </motion.div>
            ))}
            {confirmedStories.length === 0 && (
              <div className="border-2 border-dashed border-green-500/20 rounded-xl p-8 text-center text-muted-foreground text-sm">
                Move stories here to confirm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
