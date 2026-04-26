'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, ArrowRight, AlertCircle, CheckCircle, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage1Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

const PILLAR_LABELS = ['Core Problem', 'Target Persona', 'User Flow', 'Success Metrics']
const PILLAR_KEYS = ['core_problem', 'target_persona', 'user_flow', 'success_metrics']

export function Stage1Discovery({ project, onUpdate }: Props) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const stage = project.stage1
  const chatHistory = stage?.chat_history || []
  const readinessScore = stage?.readiness_score || 0
  const pillars = stage?.pillars || {}
  const isCompleted = stage?.status === 'completed'
  const canProceed = readinessScore >= 0.85

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const sendMessage = async () => {
    if (!message.trim() || sending) return
    const msg = message.trim()
    setMessage('')
    setSending(true)
    try {
      const res = await stage1Api.chat(project.id, msg)
      onUpdate(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setMessage(msg)
    } finally {
      setSending(false)
    }
  }

  const handleProceed = async (force = false) => {
    setProceeding(true)
    try {
      const res = await stage1Api.proceed(project.id, force)
      onUpdate(res.data)
      toast.success('Stage 1 complete! Moving to Feature Mapping.')
    } catch (err) {
      const msg = getErrorMessage(err)
      if (msg.includes('0.85 threshold')) {
        if (confirm(`Readiness score is ${(readinessScore * 100).toFixed(0)}%. Force proceed anyway?`)) {
          await handleProceed(true)
        }
      } else {
        toast.error(msg)
      }
    } finally {
      setProceeding(false)
    }
  }

  return (
    <div className="flex h-full gap-6">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="card-glass rounded-2xl flex flex-col h-full overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-display font-bold text-lg">Discovery Chat</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCompleted ? '✅ Discovery complete' : 'Answer the AI\'s questions to define your project'}
              </p>
            </div>
            {chatHistory.length > 0 && !isCompleted && (
              <button
                onClick={() => handleProceed()}
                disabled={proceeding}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  canProceed
                    ? 'bg-green-600 hover:bg-green-500 text-white hover:shadow-lg hover:shadow-green-500/20'
                    : 'border border-border text-muted-foreground hover:bg-accent'
                )}
              >
                {proceeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {canProceed ? 'Proceed to Stage 2' : 'Force Proceed'}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin min-h-0">
            {chatHistory.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-forge-500/20 border border-forge-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-forge-400" />
                </div>
                <div className="flex-1">
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] inline-block">
                    <p className="text-sm leading-relaxed">
                      Hi! I'm your Discovery Analyst. I'll help you articulate your software idea by exploring 4 key pillars: 
                      the core problem, your target persona, the user flow, and success metrics.
                      <br /><br />
                      Let's start simple — <strong>What problem are you trying to solve?</strong> Describe it in your own words.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {chatHistory.map((msg: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex items-start gap-3', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'user'
                    ? 'bg-forge-500/20 border border-forge-500/30'
                    : 'bg-forge-500/20 border bordeforge-500/20'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-forge-400" />
                    : <Bot className="w-4 h-4 text-forge-500" />
                  }
                </div>
                <div className={cn(
                  'rounded-2xl px-4 py-3 max-w-[75%] text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-forge-500/20 border border-forge-500/20 rounded-tr-sm'
                    : 'bg-secondary rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {sending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-forge-500" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {!isCompleted && (
            <div className="p-4 border-t border-border/40 flex-shrink-0">
              <div className="flex gap-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Describe your idea... (Enter to send, Shift+Enter for newline)"
                  rows={2}
                  disabled={sending}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all text-sm resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !message.trim()}
                  className="w-12 h-12 rounded-xl bg-forge-600 hover:bg-forge-500 disabled:opacity-50 text-white flex items-center justify-center transition-all self-end"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Readiness panel */}
      <div className="w-72 space-y-4 flex-shrink-0">
        {/* Score card */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm mb-4">Readiness Score</h3>
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={readinessScore >= 0.85 ? '#22c55e' : readinessScore >= 0.5 ? '#6271f1' : '#6b7280'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${readinessScore * 251.2} 251.2`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                'text-2xl font-display font-bold',
                readinessScore >= 0.85 ? 'text-green-400' : 'text-foreground'
              )}>
                {(readinessScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {canProceed ? (
            <div className="flex items-center gap-2 text-green-400 text-xs justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
              Ready to proceed!
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              Need 85% to proceed
            </div>
          )}
        </div>

        {/* Pillars */}
        <div className="card-glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm mb-4">Discovery Pillars</h3>
          <div className="space-y-3">
            {PILLAR_KEYS.map((key, i) => {
              const score = pillars[key]?.score || 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{PILLAR_LABELS[i]}</span>
                    <span className={score >= 0.8 ? 'text-green-400' : 'text-muted-foreground'}>
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        score >= 0.8 ? 'bg-green-500' : score >= 0.5 ? 'bg-forge-500' : 'bg-muted-foreground'
                      )}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* PVD preview */}
        {isCompleted && stage?.product_vision_document && (
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <h3 className="font-display font-bold text-sm">PVD Generated</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stage.product_vision_document.raw_summary?.slice(0, 120)}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
