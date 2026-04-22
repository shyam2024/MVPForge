'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Monitor, Send, CheckCircle, ArrowRight, Eye, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage5Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

export function Stage5UIPrototyping({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<any>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editing, setEditing] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  const stage = project.stage5
  const isCompleted = stage?.status === 'completed'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage5Api.generate(project.id)
      onUpdate(res.data)
      toast.success('UI screens generated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedScreen || !editPrompt.trim()) return
    setEditing(true)
    try {
      const res = await stage5Api.editScreen(project.id, selectedScreen.id, editPrompt)
      onUpdate(res.data)
      setEditPrompt('')
      // Refresh selected screen from updated data
      const updatedScreens = res.data.stage5?.screens || []
      const updated = updatedScreens.find((s: any) => s.id === selectedScreen.id)
      if (updated) setSelectedScreen(updated)
      toast.success('Screen updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setEditing(false)
    }
  }

  const handleApprove = async (screenId: string) => {
    setApproving(screenId)
    try {
      const res = await stage5Api.approveScreen(project.id, screenId)
      onUpdate(res.data)
      toast.success('Screen approved!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setApproving(null)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await stage5Api.confirm(project.id)
      onUpdate(res.data)
      toast.success('UI approved! Moving to Implementation Plan.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="font-display font-bold text-2xl">UI Prototyping</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          AI will generate HTML+Tailwind screens based on your architecture and features.
        </p>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-medium transition-all">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />}
          {generating ? 'Generating Screens...' : 'Generate UI Screens'}
        </button>
      </div>
    )
  }

  const screens: any[] = stage.screens || []
  const approvedCount = screens.filter((s: any) => s.approved).length

  return (
    <div className="flex h-full gap-5">
      {/* Screen list */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Screens</h3>
          <span className="text-xs text-muted-foreground">{approvedCount}/{screens.length}</span>
        </div>
        <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-thin">
          {screens.map((screen: any) => (
            <button
              key={screen.id}
              onClick={() => setSelectedScreen(screen)}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                selectedScreen?.id === screen.id ? 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-400' : 'hover:bg-accent text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2">
                {screen.approved ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" />
                )}
                <span className="truncate font-medium">{screen.name}</span>
              </div>
              <p className="text-xs mt-0.5 truncate opacity-70">{screen.route}</p>
            </button>
          ))}
        </div>

        {!isCompleted && (
          <button onClick={handleConfirm} disabled={confirming} className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all mt-2">
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Confirm UI
          </button>
        )}
      </div>

      {/* Preview panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {selectedScreen ? (
          <>
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-display font-bold text-lg">{selectedScreen.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedScreen.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedScreen.approved ? (
                  <span className="flex items-center gap-1.5 text-green-400 text-sm"><CheckCircle className="w-4 h-4" />Approved</span>
                ) : !isCompleted ? (
                  <button
                    onClick={() => handleApprove(selectedScreen.id)}
                    disabled={approving === selectedScreen.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 text-sm font-medium transition-all"
                  >
                    {approving === selectedScreen.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                ) : null}
              </div>
            </div>

            {/* Iframe preview */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-border/40 bg-white min-h-0">
              <iframe
                srcDoc={selectedScreen.html_content}
                className="w-full h-full"
                title={selectedScreen.name}
                sandbox="allow-scripts"
              />
            </div>

            {/* Edit prompt */}
            {!isCompleted && (
              <div className="flex gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-400/5 border border-yellow-400/20 flex-shrink-0">
                  <Wand2 className="w-4 h-4 text-yellow-400" />
                </div>
                <input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  placeholder="Describe changes to this screen..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border focus:border-yellow-400/50 outline-none text-sm"
                />
                <button onClick={handleEdit} disabled={editing || !editPrompt.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-600/80 hover:bg-yellow-500/80 text-white text-sm font-medium disabled:opacity-50 transition-all">
                  {editing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Edit
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a screen to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
